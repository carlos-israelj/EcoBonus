import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MapInstance, StyleSpecification } from 'maplibre-gl'
import { Crosshair, Layers, LocateFixed, Minus, Navigation, Pause, Play, Plus } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Coordinates, Spot } from './types'
import { AREQUIPA_TEST_POINTS } from './data'

const cartoStyle: StyleSpecification = {
  version: 8,
  sources: { carto: { type: 'raster', tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>', maxzoom: 19 } },
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eaf0e7' } }, { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-saturation': -0.25, 'raster-contrast': 0.02 } }],
}
const basemapsKey = (import.meta.env.PUBLIC_BASEMAPS_API_KEY || import.meta.env.VITE_BASEMAPS_API_KEY) as string | undefined
const maptilerKey = (import.meta.env.PUBLIC_MAPTILER_KEY || import.meta.env.VITE_MAPTILER_KEY) as string | undefined
const mapStyle: StyleSpecification | string = basemapsKey
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(basemapsKey)}`
  : maptilerKey
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(maptilerKey)}`
  : cartoStyle
maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl-worker.mjs')
export default function MapView({ spots, selected, onSelect, position, onPosition }: { spots: Spot[]; selected?: Spot; onSelect: (spot: Spot) => void; position: Coordinates; onPosition: (position: Coordinates, source: 'demo' | 'gps') => void }) {
  const container = useRef<HTMLDivElement>(null), map = useRef<MapInstance | null>(null), player = useRef<maplibregl.Marker | null>(null)
  const onSelectRef = useRef(onSelect), onPositionRef = useRef(onPosition)
  onSelectRef.current = onSelect; onPositionRef.current = onPosition
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle'), [walking, setWalking] = useState(false), [tilted, setTilted] = useState(false), [tracking, setTracking] = useState(false), [locationPrompt, setLocationPrompt] = useState(true)
  const watch = useRef<number | undefined>(undefined), routeAbort = useRef<AbortController | null>(null), routePath = useRef<Coordinates[]>([])
  useEffect(() => {
    if (!container.current) return
    let view: MapInstance
    try { view = new maplibregl.Map({ container: container.current, style: mapStyle, center: position, zoom: 14.3, minZoom: 3, maxZoom: 19, pitch: 0, attributionControl: { compact: true }, maxBounds: [[-81.5, -18.5], [-68.5, -0.5]] }) }
    catch { setError('Tu navegador no pudo iniciar el mapa. Puedes explorar las misiones en la lista.'); return }
    map.current = view
    view.on('load', () => {
      view.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } })
      view.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#169f8c', 'line-width': 4, 'line-dasharray': [1.5, 1.5] } })
      setReady(true)
    })
    view.on('error', () => setError('El mapa base no está disponible. Las misiones siguen accesibles.'))
    view.on('idle', () => { if (view.areTilesLoaded()) setError('') })
    const el = document.createElement('div'); el.className = 'map-player'; el.innerHTML = '<span class="player-ring"></span><span class="player-core"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg></span>'; el.setAttribute('aria-label', 'Tu posición en el mapa')
    player.current = new maplibregl.Marker({ element: el }).setLngLat(position).addTo(view)
    const observer = new ResizeObserver(() => view.resize()); observer.observe(container.current)
    return () => { if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current); routeAbort.current?.abort(); observer.disconnect(); view.remove(); map.current = null; player.current = null }
  }, [])
  useEffect(() => {
    const view = map.current
    if (!view) return
    const markers = spots.map(spot => {
      const element = document.createElement('button'); element.className = `map-leaf-button ${spot.severity} ${selected?.id === spot.id ? 'selected' : ''}`
      element.setAttribute('aria-label', `Ver ${spot.name}`); element.title = spot.name
      element.innerHTML = '<span class="map-leaf"><i></i></span><span class="marker-shadow"></span>'
      element.onclick = () => onSelectRef.current(spot)
      return new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat(spot.coordinates).addTo(view)
    })
    return () => markers.forEach(marker => marker.remove())
  }, [spots, selected?.id, ready])
  useEffect(() => {
    const view = map.current
    if (!view || !ready || position[0] <= -73) return
    const markers = AREQUIPA_TEST_POINTS.map(point => {
      const element = document.createElement('div')
      element.className = `map-leaf-button ${point.severity}`
      element.innerHTML = '<span class="map-leaf"><i></i></span><span class="marker-shadow"></span>'
      element.setAttribute('aria-label', `Punto de prueba: ${point.name}`)
      element.title = `${point.name} · prueba temporal`
      return new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat(point.coordinates).addTo(view)
    })
    return () => markers.forEach(marker => marker.remove())
  }, [position, ready])
  useEffect(() => { if (selected) map.current?.flyTo({ center: selected.coordinates, zoom: 15, duration: 1200, padding: { top: 80, bottom: 120, left: 0, right: 0 } }) }, [selected])
  useEffect(() => {
    player.current?.setLngLat(position)
    if (tracking || walking) map.current?.easeTo({ center: position, duration: 950 })
  }, [position, tracking, walking])
  useEffect(() => {
    const source = map.current?.getSource('route') as GeoJSONSource | undefined
    if (!ready || !source) return
    routeAbort.current?.abort()
    if (!selected) { routePath.current = []; setRouteStatus('idle'); void source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }); return }
    const origin = [...position] as Coordinates, destination = selected.coordinates
    const controller = new AbortController(); routeAbort.current = controller; routePath.current = []; setRouteStatus('loading')
    const routeUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=false`
    fetch(routeUrl, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('route-request-failed'); return response.json() as Promise<{ code?: string; routes?: Array<{ geometry?: { coordinates?: Coordinates[] } }> }> }).then(result => {
      const geometry = result.code === 'Ok' ? result.routes?.[0]?.geometry : undefined
      if (!geometry?.coordinates?.length) throw new Error('route-empty')
      routePath.current = geometry.coordinates; void source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: geometry.coordinates } }); setRouteStatus('ready')
    }).catch(routeError => { if ((routeError as Error).name !== 'AbortError') { routePath.current = []; void source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }); setRouteStatus('error') } })
    return () => controller.abort()
    // Recalcula al elegir una misión; la ruta conserva el origen para no pedir una nueva ruta en cada actualización GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ready])
  useEffect(() => {
    if (!walking) return
    if (watch.current !== undefined) { navigator.geolocation.clearWatch(watch.current); watch.current = undefined; setTracking(false) }
    let step = 0
    const origin = [...position] as Coordinates, target = selected?.coordinates ?? [-77.0304, -12.1211], path = routePath.current.length > 1 ? routePath.current : [origin, target]
    const lengths = path.slice(1).map((point, index) => Math.hypot(point[0] - path[index]![0], point[1] - path[index]![1])), total = lengths.reduce((sum, value) => sum + value, 0)
    const pointAt = (progress: number): Coordinates => { if (path.length === 0) return origin; if (path.length === 1 || !total) return path[path.length - 1]!; let remaining = total * progress; for (let index = 0; index < lengths.length; index++) { const segment = lengths[index]!, start = path[index]!, end = path[index + 1]!; if (remaining <= segment) { const ratio = segment ? remaining / segment : 1; return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio] } remaining -= segment } return path[path.length - 1]! }
    const timer = setInterval(() => { step++; onPositionRef.current(pointAt(Math.min(1, step / 22)), 'demo'); if (step >= 22) setWalking(false) }, 700)
    return () => clearInterval(timer)
    // A walk uses the origin and destination captured when it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking])
  const locate = () => {
    if (tracking) { if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current); watch.current = undefined; setTracking(false); return }
    if (!navigator.geolocation) { setLocationPrompt(true); setError('Tu navegador no admite ubicación. Usa el recorrido demo.'); return }
    setWalking(false); setTracking(true)
    watch.current = navigator.geolocation.watchPosition(result => {
      const coords: Coordinates = [result.coords.longitude, result.coords.latitude]
      if (coords[0] < -81.5 || coords[0] > -68.5 || coords[1] < -18.5 || coords[1] > -0.5) { setLocationPrompt(true); setError('Esta ubicación está fuera del piloto en Perú. Puedes explorar con el recorrido demo.'); if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current); watch.current = undefined; setTracking(false); return }
      setError(''); onPositionRef.current(coords, 'gps')
    }, failure => { setLocationPrompt(true); setError(failure.code === 1 ? 'Ubicación no permitida. Actívala en tu navegador o usa el recorrido demo.' : 'No pudimos obtener tu ubicación. Inténtalo en un lugar abierto.'); if (watch.current !== undefined) navigator.geolocation.clearWatch(watch.current); watch.current = undefined; setTracking(false) }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 })
  }
  const activateLocation = () => { setLocationPrompt(false); locate() }
  return <div className="map-wrap"><div className="map-canvas" ref={container} aria-label="Mapa interactivo de misiones" />
    {!ready && !error && <div className="map-loading"><LeafSpinner /> Preparando tu ciudad…</div>}
    {error && <div className="map-error" role="status">{error}</div>}
    {routeStatus === 'loading' && <div className="map-route-status" role="status">Calculando ruta peatonal…</div>}
    {routeStatus === 'error' && <div className="map-route-status warning" role="status">No pudimos calcular la ruta peatonal. Revisa tu conexión.</div>}
    {locationPrompt && !tracking && <div className="map-location-prompt" role="dialog" aria-label="Activar ubicación"><span className="map-location-prompt-icon"><LocateFixed size={24} /></span><div><strong>Activa tu ubicación</strong><p>Encuentra misiones cerca de ti y sigue tu impacto en el mapa.</p></div><button className="button primary" onClick={activateLocation}>Activar ubicación</button></div>}
    <div className="map-location"><span className="live-dot" /><b>{position[0] > -73 ? 'Arequipa, Perú' : 'Lima, Perú'}</b><span>{tracking ? 'GPS activo' : 'Explora tu entorno'}</span></div>
    <div className="map-controls"><button aria-label="Acercar mapa" onClick={() => map.current?.zoomIn()}><Plus size={19} /></button><button aria-label="Alejar mapa" onClick={() => map.current?.zoomOut()}><Minus size={19} /></button><span /><button className={tilted ? 'active' : ''} aria-label="Alternar perspectiva del mapa" aria-pressed={tilted} onClick={() => { setTilted(!tilted); map.current?.easeTo({ pitch: tilted ? 0 : 48, bearing: tilted ? 0 : -15, duration: 900 }) }}><Layers size={19} /></button><button aria-label="Volver al norte" onClick={() => map.current?.resetNorthPitch()}><Navigation size={19} /></button></div>
    <button className={`map-locate ${tracking ? 'active' : ''}`} aria-label={tracking ? 'Detener seguimiento GPS' : 'Usar mi ubicación'} onClick={locate}>{tracking ? <><LocateFixed size={18} /><span>Desactivar</span></> : <Crosshair size={21} />}</button>
    <div className="map-legend"><span><i className="high" /> Alta</span><span><i className="medium" /> Media</span><span><i className="clean" /> Recuperada</span></div>
    <button className={`walk-button ${walking ? 'walking' : ''}`} onClick={() => setWalking(!walking)}>{walking ? <Pause size={14} /> : <Play size={14} />} {walking ? 'Pausar recorrido' : 'Probar recorrido'}<span>DEMO</span></button>
  </div>
}
function LeafSpinner() { return <span className="loading-leaf" /> }
