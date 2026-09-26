# Backend Integration Guide

**Fecha:** 2026-09-26
**Backend URL:** https://ecobonus-backend.onrender.com
**Status:** ✅ OPERACIONAL

---

## 📋 Overview

El frontend EcoBonus se conecta al backend desplegado en Render para acceder a:
- GPS missions discovery (PostGIS)
- Vouchers catalog
- Leaderboard rankings
- Photo validation (EXIF + perceptual hashing)

---

## 🔧 Configuración

### Environment Variables

El archivo `.env` ya está configurado con:

```bash
PUBLIC_BACKEND_URL="https://ecobonus-backend.onrender.com"
```

Para desarrollo local con backend local:

```bash
PUBLIC_BACKEND_URL="http://localhost:3001"
```

---

## 📚 API Client

### Ubicación

- **API Client:** `src/eco/api.ts`
- **React Hooks:** `src/hooks/useBackendData.ts`

### Endpoints Disponibles

```typescript
import {
  getHealth,
  getMissionsNearby,
  getVouchersCatalog,
  getLeaderboard,
  uploadBeforePhoto,
  uploadAfterPhoto,
  validatePhotos,
} from './eco/api'
```

---

## 🚀 Uso en Componentes

### 1. GPS Missions Nearby

**Hook personalizado:**

```typescript
import { useNearbyMissions } from '@/hooks/useBackendData'

function MyComponent() {
  const userLat = -12.116373
  const userLon = -77.031105
  const radius = 1000 // meters

  const { data, loading, error, refetch } = useNearbyMissions(
    userLat,
    userLon,
    radius,
    true // enabled
  )

  if (loading) return <div>Cargando misiones...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <div>
      <h2>Misiones Cercanas ({data.count})</h2>
      {data.missions.map(mission => (
        <div key={mission.mission_code}>
          <h3>{mission.title}</h3>
          <p>{mission.description}</p>
          <p>Distancia: {mission.distance_meters}m</p>
          <p>Puntos: {mission.reward_points}</p>
        </div>
      ))}
    </div>
  )
}
```

**Directo con la API:**

```typescript
import { getMissionsNearby } from '@/eco/api'

async function loadMissions() {
  try {
    const response = await getMissionsNearby(-12.116373, -77.031105, 1000)
    console.log(`Encontradas ${response.count} misiones`)
    console.log(response.missions)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### 2. Vouchers Catalog

**Hook personalizado:**

```typescript
import { useVouchersCatalog } from '@/hooks/useBackendData'

function VouchersPage() {
  const { data, loading, error, refetch } = useVouchersCatalog(true)

  if (loading) return <div>Cargando catálogo...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <div>
      <h2>Catálogo de Vouchers</h2>
      {data.vouchers.map(voucher => (
        <div key={voucher.id}>
          <h3>{voucher.name}</h3>
          <p>{voucher.description}</p>
          <p>Costo: {voucher.points_cost} puntos</p>
          <p>Stock: {voucher.stock}</p>
          <p>Sponsor: {voucher.sponsor}</p>
        </div>
      ))}
      <button onClick={refetch}>Actualizar</button>
    </div>
  )
}
```

### 3. Leaderboard

**Hook personalizado:**

```typescript
import { useLeaderboard } from '@/hooks/useBackendData'

function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly')
  const { data, loading, error, refetch } = useLeaderboard(period, true)

  if (loading) return <div>Cargando ranking...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  return (
    <div>
      <h2>Ranking {data.period}</h2>
      <div>
        <button onClick={() => setPeriod('weekly')}>Semanal</button>
        <button onClick={() => setPeriod('monthly')}>Mensual</button>
        <button onClick={() => setPeriod('all_time')}>Histórico</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Usuario</th>
            <th>Puntos</th>
            <th>Misiones</th>
            <th>Impact Score</th>
          </tr>
        </thead>
        <tbody>
          {data.leaderboard.map(entry => (
            <tr key={entry.user_id}>
              <td>{entry.rank}</td>
              <td>{entry.username}</td>
              <td>{entry.total_points}</td>
              <td>{entry.missions_completed}</td>
              <td>{entry.impact_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 4. Photo Upload & Validation

**Upload Before Photo:**

```typescript
import { uploadBeforePhoto } from '@/eco/api'

async function handleBeforePhotoUpload(claimId: string, file: File, authToken: string) {
  try {
    const response = await uploadBeforePhoto(claimId, file, authToken)

    if (response.success && response.data) {
      console.log('Foto subida:', response.data.photo_url)
      if (response.data.exif_gps) {
        console.log('GPS encontrado:', response.data.exif_gps)
      }
    }
  } catch (error) {
    console.error('Error al subir foto:', error)
  }
}
```

**Upload After Photo:**

```typescript
import { uploadAfterPhoto } from '@/eco/api'

async function handleAfterPhotoUpload(claimId: string, file: File, authToken: string) {
  try {
    const response = await uploadAfterPhoto(claimId, file, authToken)

    if (response.success && response.data) {
      console.log('Foto después subida:', response.data.photo_url)
    }
  } catch (error) {
    console.error('Error al subir foto:', error)
  }
}
```

**Validate Photos:**

```typescript
import { validatePhotos } from '@/eco/api'

async function handleValidatePhotos(claimId: string, authToken: string) {
  try {
    const response = await validatePhotos(claimId, authToken)

    if (response.success && response.data) {
      console.log('Validation Score:', response.data.validation_score)
      console.log('Location Valid:', response.data.location_valid)
      console.log('Photos Different:', response.data.photos_different)
      console.log('GPS Present:', response.data.gps_data_present)
      console.log('Message:', response.data.message)
    }
  } catch (error) {
    console.error('Error al validar fotos:', error)
  }
}
```

### 5. Backend Health Check

**Hook personalizado:**

```typescript
import { useBackendHealth } from '@/hooks/useBackendData'

function HealthIndicator() {
  const { data, loading, error } = useBackendHealth(true)

  if (loading) return <div>Verificando conexión...</div>
  if (error) return <div>⚠️ Backend offline</div>
  if (!data || !data.success) return <div>⚠️ Backend unhealthy</div>

  return (
    <div>
      ✅ Backend: {data.status}
      <details>
        <summary>Features</summary>
        <ul>
          <li>Auth: {data.features.auth}</li>
          <li>Database: {data.features.database}</li>
          <li>GPS: {data.features.gps}</li>
          <li>Photo Validation: {data.features.photoValidation}</li>
          <li>Vouchers: {data.features.vouchers}</li>
          <li>Leaderboard: {data.features.leaderboard}</li>
        </ul>
      </details>
    </div>
  )
}
```

---

## 🔄 Migración desde Datos Hardcodeados

### Estado Actual

El frontend usa datos de prueba en `src/eco/data.ts`:

```typescript
export const spots: Spot[] = [/* datos hardcodeados */]
export const rewards: Reward[] = [/* datos hardcodeados */]
```

### Plan de Migración

1. **Crear adaptadores** para convertir respuestas del backend al formato local:

```typescript
// src/eco/adapters.ts
import type { Spot } from './types'
import type { MissionNearby } from './api'

export function missionToSpot(mission: MissionNearby): Spot {
  return {
    id: mission.mission_code,
    name: mission.title,
    district: 'Miraflores', // extraer del backend o usar default
    zone: 'Parques', // mapear difficulty_level a zone
    coordinates: [mission.longitude, mission.latitude],
    severity: mission.difficulty_level === 'hard' ? 'high' : 'medium',
    points: mission.reward_points,
    minutes: mission.estimated_time_minutes,
    image: '/images/park.jpg', // placeholder
    description: mission.description,
    validator: 'Backend validator',
    updated: 'Ahora',
  }
}
```

2. **Actualizar Zustand store** para usar API calls:

```typescript
// En src/eco/store.ts
import { getMissionsNearby } from './api'
import { missionToSpot } from './adapters'

// Añadir acción para cargar spots desde backend
loadSpotsFromBackend: async (lat: number, lon: number, radius: number) => {
  const response = await getMissionsNearby(lat, lon, radius)
  const spots = response.missions.map(missionToSpot)
  set({ spots })
}
```

3. **Actualizar componentes** para usar datos del backend:

```typescript
// En Explore.tsx
useEffect(() => {
  if (userLocation) {
    loadSpotsFromBackend(userLocation.lat, userLocation.lon, 5000)
  }
}, [userLocation])
```

---

## 🧪 Testing

### Test de Conexión

```typescript
import { testConnection } from '@/eco/api'

async function checkBackend() {
  const isHealthy = await testConnection()
  console.log('Backend status:', isHealthy ? 'CONNECTED' : 'OFFLINE')
}
```

### Test Manual con curl

```bash
# Health check
curl https://ecobonus-backend.onrender.com/api/health

# GPS missions (Lima, Perú)
curl "https://ecobonus-backend.onrender.com/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=1000"

# Vouchers
curl https://ecobonus-backend.onrender.com/api/vouchers/catalog

# Leaderboard
curl https://ecobonus-backend.onrender.com/api/leaderboard
```

---

## ⚠️ Consideraciones

### CORS

El backend está configurado con `CORS_ORIGIN: "*"` para desarrollo.

Cuando despliegues el frontend, actualiza el backend en Render:
```bash
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Rate Limiting

El plan free de Render puede dormirse después de 15 minutos de inactividad.
- Primera request puede tardar ~30 segundos (cold start)
- Requests subsecuentes son rápidas

### Error Handling

Todos los hooks incluyen manejo de errores:

```typescript
const { data, loading, error, refetch } = useNearbyMissions(lat, lon, radius)

if (error) {
  // Mostrar mensaje al usuario
  // Opción de reintentar con refetch()
}
```

---

## 📊 Endpoints del Backend

| Endpoint | Method | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Health check + features |
| `/api/missions/nearby?lat=X&lon=Y&radius=Z` | GET | Misiones cercanas (PostGIS) |
| `/api/vouchers/catalog` | GET | Catálogo de vouchers |
| `/api/leaderboard?period=weekly` | GET | Rankings de usuarios |
| `/api/claims/:id/upload-before` | POST | Subir foto antes (multipart) |
| `/api/claims/:id/upload-after` | POST | Subir foto después (multipart) |
| `/api/claims/:id/validate-photos` | POST | Validar ambas fotos |

---

## 🎯 Próximos Pasos

1. ✅ API client creado (`src/eco/api.ts`)
2. ✅ React hooks creados (`src/hooks/useBackendData.ts`)
3. ✅ Environment variables configuradas
4. ⏳ Adaptar componentes para usar API real
5. ⏳ Migrar de datos hardcodeados a backend
6. ⏳ Implementar autenticación (Privy Auth)
7. ⏳ Desplegar frontend en Vercel

---

**Documentación actualizada:** 2026-09-26
**Backend Version:** 2.0.0-supabase
