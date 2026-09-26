import { useEffect, useState } from 'react'
import { Bell, ChevronDown, Compass, Download, Gift, HelpCircle, LayoutDashboard, Leaf, MapPin, Menu, ShieldCheck, Sparkles, Trophy, UserRound, X, Flag, Settings, WifiOff, ArrowUpRight, Building2 } from 'lucide-react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEco } from './store'
import { Logo, Modal, Points, Progress } from './ui'

interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const links = [
  { to: '/', label: 'Explorar', icon: Compass },
  { to: '/misiones', label: 'Mis misiones', icon: Flag },
  { to: '/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/comunidad', label: 'Comunidad', icon: Trophy },
  { to: '/perfil', label: 'Mi perfil', icon: UserRound },
]
export default function Layout() {
  const { profile, points, xp, theme, missions, joined } = useEco()
  const [menu, setMenu] = useState(false), [notices, setNotices] = useState(false), [install, setInstall] = useState(false)
  const [online, setOnline] = useState(navigator.onLine), [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const location = useLocation()
  useEffect(() => { setMenu(false); window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => { document.documentElement.dataset.theme = theme === 'system' ? media.matches ? 'dark' : 'light' : theme }
    update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update)
  }, [theme])
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt) }
    window.addEventListener('online', on); window.addEventListener('offline', off); window.addEventListener('beforeinstallprompt', capture)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('beforeinstallprompt', capture) }
  }, [])
  if (!joined) return <Navigate to="/login" replace />
  const level = Math.floor(xp / 100) + 1
  return <div className="app-shell">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    {menu && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <div className="sidebar-brand"><Logo /><button className="icon-button mobile-only" aria-label="Cerrar menú" onClick={() => setMenu(false)}><X /></button></div>
      <div className="city-label"><span className="live-dot" /> LIMA, PERÚ <span className="city-tag">PILOTO</span></div>
      <p className="nav-label">TU CIUDAD, TU IMPACTO</p>
      <nav aria-label="Navegación principal">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={20} /><span>{label}</span>{to === '/misiones' && missions.some(m => m.status === 'active') && <span className="nav-count">1</span>}</NavLink>)}</nav>
      <Link className="report-nav" to="/reportar"><MapPin size={19} /> Reportar un foco <span>+</span></Link>
      <div className="sidebar-level"><div className="level-icon"><Leaf size={22} /></div><div><b>Guardián urbano</b><p>Nivel {level} <span>·</span> {xp} XP</p></div><Progress value={xp % 100} label="Progreso al siguiente nivel" /><small>{100 - xp % 100} XP para tu siguiente nivel</small></div>
      <div className="sidebar-bottom"><p className="nav-label">ECOSISTEMA · DEMO</p><NavLink className="nav-item" to="/validador"><ShieldCheck size={19} /> Validación</NavLink><NavLink className="nav-item" to="/sponsor"><Building2 size={19} /> Patrocinadores</NavLink><NavLink className="nav-item" to="/admin"><LayoutDashboard size={19} /> Administración</NavLink><div className="sidebar-tools"><Link to="/ayuda"><HelpCircle size={17} /> Ayuda</Link><Link to="/ajustes" aria-label="Ajustes"><Settings size={17} /></Link><button onClick={() => setInstall(true)} aria-label="Instalar aplicación"><Download size={17} /></button></div><div className="stellar-wordmark"><span>Construido sobre</span><b>◉ Stellar</b></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-only" aria-label="Abrir menú" onClick={() => setMenu(true)}><Menu size={23} /></button><div className="desktop-only breadcrumb">EcoBonus <span>/</span> {links.find(l => l.to === location.pathname)?.label ?? 'Tu impacto'}</div><div className="mobile-brand"><Logo /></div></div><div className="topbar-actions"><span className="demo-pill"><span /> Demo interactiva</span><Link className="balance-pill" to="/recompensas"><Points value={points} /></Link><button className="icon-button notification-button" aria-label="Ver notificaciones" onClick={() => setNotices(true)}><Bell size={20} /><i /></button><Link to={joined ? '/perfil' : '/bienvenida'} className="user-pill"><span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span><span className="desktop-only">{profile.name}<ChevronDown size={13} /></span></Link></div></header>
      {!online && <div className="offline-banner" role="status"><WifiOff size={16} /> Estás sin conexión. Tu progreso local sigue disponible; el mapa necesita internet.</div>}
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="page-footer"><span><Leaf size={13} /> Cada pequeña acción cuenta.</span><span>Lima, Perú <span className="tiny-dot">·</span> Hecho para un futuro más verde</span></footer>
    </div>
    <nav className="bottom-nav" aria-label="Navegación móvil">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={22} /><span>{label === 'Mis misiones' ? 'Misiones' : label === 'Mi perfil' ? 'Perfil' : label}</span></NavLink>)}</nav>
    {notices && <Modal title="Tu actividad" onClose={() => setNotices(false)}><div className="notice-list"><div><span className="notice-icon"><Sparkles size={20} /></span><section><b>¡Tu ciudad te está esperando!</b><p>Tienes 320 ECO de ejemplo para probar tu primer canje.</p><small>Bienvenida a la demo</small></section></div>{missions.slice(0, 4).map(m => <Link key={m.id} to={`/mision/${m.id}`} onClick={() => setNotices(false)}><span className="notice-icon"><Flag size={20} /></span><section><b>{m.status === 'approved' ? 'Tu misión fue aprobada' : m.status === 'rejected' ? 'Revisa el comentario del validador' : m.status === 'pending' ? 'Evidencia enviada a revisión' : 'Tienes una misión en curso'}</b><p>{m.spotId}</p></section><ArrowUpRight size={16} /></Link>)}</div></Modal>}
    {install && <Modal title="Lleva EcoBonus contigo" onClose={() => setInstall(false)}><div className="install-illustration"><Logo /></div><p>Abre tus misiones desde la pantalla de inicio de tu celular.</p>{prompt ? <button className="button primary full" onClick={async () => { await prompt.prompt(); const result = await prompt.userChoice; if (result.outcome === 'accepted') { setPrompt(null); setInstall(false) } }}>Instalar EcoBonus <Download size={18} /></button> : <div className="info-block"><b>Desde tu navegador</b><p>Android: menú ⋮ → Instalar aplicación.<br />iPhone: Compartir → Agregar a inicio.</p><p className="muted">La instalación requiere HTTPS o localhost y la versión compilada de la PWA.</p></div>}</Modal>}
  </div>
}
