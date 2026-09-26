# EcoBonus - Roadmap Frontend

**Versión**: 1.0
**Última Actualización**: 2026-09-24
**Basado en**: `docs/ui-mockup-ecobonus.png` + `docs/prd-ecobonus.docx`

---

## 🎨 Stack Tecnológico

### Core
- **Framework**: React 18+ con Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules (para pins personalizados)
- **State Management**: Zustand (lightweight, simple)
- **Routing**: React Router v6

### Autenticación
- **Privy React SDK**: Social login + embedded wallets
- **Freighter Wallet**: (opcional) para usuarios crypto-nativos

### Mapas
- **MapLibre GL JS**: Open-source alternative to Mapbox
- **React-Map-GL**: React wrapper for MapLibre
- **Turf.js**: Geospatial calculations (distance, zones)

### Blockchain
- **@stellar/stellar-sdk**: Stellar operations
- **Freighter API**: Browser extension integration

### Media & Upload
- **React Webcam**: Capture photos (before/after)
- **Compressor.js**: Client-side image compression
- **IPFS HTTP Client** (via backend): Photo storage

### UI Components
- **Radix UI** o **shadcn/ui**: Accessible primitives
- **Framer Motion**: Animations (level-up, achievement unlocks)
- **React Hot Toast**: Notifications
- **QR Code Generator**: Voucher redemption codes

---

## 🗺️ Pantallas del Mockup (5 Screens)

### Screen 1: Login/Onboarding
**Elementos**:
- Logo EcoBonus
- Título: "Limpia tu ciudad, gana recompensas"
- Botón: "Continuar con Passkey" (Privy)
- Botón: "Conectar Freighter Wallet"
- Link: "¿Cómo funciona?"

**Componentes**:
- `LoginScreen.tsx`
- `PrivyAuthButton.tsx`
- `FreighterConnectButton.tsx`

---

### Screen 2: Mapa Interactivo
**Elementos**:
- Mapa base (MapLibre GL)
- Pines personalizados por categoría:
  - Focos (rojo `#E5533D`)
  - Ríos (azul)
  - Playas (amarillo `#F2B84B`)
  - Parques (verde `#4CD787`)
- Filtros superiores (chips)
- Botón flotante: "Crear Misión" (admin)
- Pin de usuario (GPS actual)

**Componentes**:
- `MapScreen.tsx`
- `MissionPin.tsx` (CSS: `border-radius: 50% 0 50% 0` - hoja)
- `MissionCategoryFilter.tsx`
- `CreateMissionButton.tsx` (admin only)

**APIs Consumidas**:
```typescript
GET /api/missions/nearby?lat=-12.0464&lng=-77.0428&radius=5000
Response: Mission[] con { id, title, category, coords, reward_points, status }
```

---

### Screen 3: Detalle de Misión
**Elementos**:
- Foto de ubicación
- Título: "Limpieza Parque Kennedy"
- Código: `LM-MFLOR-0412`
- Estado: "Activo" | "Pendiente" | "Completado"
- Descripción
- Recompensa: "40 pts"
- Botón: "Reclamar Misión" o "Ver Evidencias"
- Mapa mini (ubicación exacta)
- Distancia: "320m de ti"

**Componentes**:
- `MissionDetailScreen.tsx`
- `MissionCard.tsx`
- `ClaimMissionButton.tsx`
- `MiniMap.tsx`

**APIs Consumidas**:
```typescript
GET /api/missions/:missionId
POST /api/missions/:missionId/claim (inicia claim)
```

---

### Screen 4: Captura de Evidencias
**Flujo**:
1. Pantalla ANTES:
   - Cámara activa
   - GPS verification indicator (20m radius)
   - Botón: "Capturar Foto ANTES"
2. Instrucciones:
   - "Ahora limpia el área"
3. Pantalla DESPUÉS:
   - Cámara activa
   - GPS verification (mismo lugar)
   - Input: "Bolsas recolectadas" (number)
   - Botón: "Capturar Foto DESPUÉS"
4. Confirmación:
   - Preview de ambas fotos
   - Botón: "Enviar a Validación"

**Componentes**:
- `EvidenceCaptureScreen.tsx`
- `CameraView.tsx` (React Webcam)
- `GPSVerificationIndicator.tsx`
- `BagCounterInput.tsx`
- `PhotoPreviewCard.tsx`

**APIs Consumidas**:
```typescript
POST /api/claims
Body: {
  missionId,
  beforePhotoBase64,
  afterPhotoBase64,
  gpsCoords: { lat, lng },
  bagsCollected: number
}
```

---

### Screen 5: Perfil & Recompensas
**Secciones**:

**5.1: Perfil**
- Avatar + nombre
- Nivel: "Guardián Urbano Nv. 4"
- Barra de progreso: "64% al nivel 5"
- Estadísticas:
  - Puntos ECO: 320 pts
  - Misiones: 18
  - Racha: 5 días 🔥

**5.2: Leaderboard**
- Pestañas: "Semanal | Mensual | Todo el tiempo"
- Scope: "Top 12 · tu universidad"
- Lista de usuarios con posición/puntos

**5.3: Vouchers**
- Catálogo:
  - Kit arroz 1kg = 250 pts
  - Aceite 1L = 300 pts
  - Útiles escolares = 180 pts
- Botón: "Canjear"
- Mis vouchers activos (QR codes)

**5.4: Mis Claims**
- Lista de evidencias enviadas
- Estados: Pendiente | Aprobado | Rechazado
- Botón: "Ver detalles"

**Componentes**:
- `ProfileScreen.tsx`
- `UserStatsCard.tsx`
- `LevelProgressBar.tsx`
- `LeaderboardTable.tsx`
- `VoucherCatalog.tsx`
- `VoucherCard.tsx`
- `QRCodeDisplay.tsx`
- `ClaimHistoryList.tsx`

**APIs Consumidas**:
```typescript
GET /api/users/me
GET /api/points/balance
GET /api/leaderboard?scope=university&period=weekly
GET /api/vouchers/catalog
POST /api/vouchers/redeem { productId, pointsCost }
GET /api/claims/me
```

---

## 📅 Roadmap por Sprints

### 🏗️ Sprint 0: Setup (Sep 24-30)
**Objetivo**: Proyecto base con autenticación

**Tasks**:
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Setup Tailwind CSS
- [ ] Instalar Privy React SDK
- [ ] Configurar routing (React Router)
- [ ] Crear layout base (navbar, bottom nav)
- [ ] Implementar login screen (Privy + Freighter)
- [ ] Setup Zustand stores (auth, user, missions)

**Deliverable**: Usuario puede hacer login con social o wallet

---

### 🗺️ Sprint 1: Mapa y Misiones (Oct 1-7)
**Objetivo**: Mapa interactivo con pines de misiones

**Tasks**:
- [ ] Integrar MapLibre GL JS
- [ ] Crear componente `MapScreen`
- [ ] Fetch missions desde `/api/missions/nearby`
- [ ] Renderizar pines por categoría
- [ ] CSS personalizado (hoja: `border-radius: 50% 0 50% 0`)
- [ ] Filtros de categoría (Focos/Ríos/Playas/Parques)
- [ ] Click en pin → Sheet con preview
- [ ] Navegación a detalle de misión

**Deliverable**: Mapa funcional con misiones visibles

---

### 📸 Sprint 2: Detalle y Claim (Oct 8-14)
**Objetivo**: Flow de reclamar misión y ver detalles

**Tasks**:
- [ ] Pantalla `MissionDetailScreen`
- [ ] Fetch mission by ID
- [ ] Mostrar: foto, título, código, reward, distancia
- [ ] Botón "Reclamar Misión" (POST `/api/missions/:id/claim`)
- [ ] Validar distancia con GPS (Turf.js)
- [ ] Navegación a captura de evidencias

**Deliverable**: Usuario puede reclamar misión si está cerca

---

### 📷 Sprint 3: Captura de Evidencias (Oct 15-21)
**Objetivo**: Dual photo capture + GPS verification

**Tasks**:
- [ ] Componente `EvidenceCaptureScreen`
- [ ] Integrar React Webcam
- [ ] Pantalla 1: Captura foto ANTES
- [ ] GPS verification indicator (círculo 20m)
- [ ] Pantalla 2: Instrucciones "Limpia el área"
- [ ] Pantalla 3: Captura foto DESPUÉS
- [ ] Input: bolsas recolectadas
- [ ] Preview de ambas fotos
- [ ] Comprimir imágenes (Compressor.js)
- [ ] POST `/api/claims` con base64 photos
- [ ] Loading state + confirmación

**Deliverable**: Usuario puede enviar evidencias duales

---

### 🎮 Sprint 4: Perfil y Puntos (Oct 22-28)
**Objetivo**: Sistema de perfil con puntos y nivel

**Tasks**:
- [ ] Pantalla `ProfileScreen`
- [ ] Fetch `/api/users/me` y `/api/points/balance`
- [ ] Mostrar: avatar, nombre, nivel, puntos
- [ ] Barra de progreso a siguiente nivel
- [ ] Estadísticas: misiones, racha
- [ ] Animación level-up (Framer Motion)
- [ ] Lista de claims del usuario
- [ ] Estados: Pendiente/Aprobado/Rechazado

**Deliverable**: Perfil completo con gamification

---

### 🏆 Sprint 5: Leaderboard (Oct 29 - Nov 4)
**Objetivo**: Rankings y competencia

**Tasks**:
- [ ] Componente `LeaderboardTable`
- [ ] Fetch `/api/leaderboard?scope=university&period=weekly`
- [ ] Pestañas: Semanal/Mensual/All-time
- [ ] Destacar posición del usuario
- [ ] Auto-refresh cada 5 min
- [ ] Animaciones de entrada

**Deliverable**: Leaderboard funcional

---

### 🎁 Sprint 6: Catálogo de Vouchers (Nov 5-11)
**Objetivo**: Redención de puntos por productos

**Tasks**:
- [ ] Pantalla `VoucherCatalog`
- [ ] Fetch `/api/vouchers/catalog`
- [ ] Cards de productos con precio en puntos
- [ ] Filtros por categoría
- [ ] Modal de confirmación de canje
- [ ] POST `/api/vouchers/redeem`
- [ ] Generar QR code (client-side)
- [ ] Pantalla "Mis Vouchers"
- [ ] Countdown de expiración

**Deliverable**: Sistema de canje funcionando

---

### 🎯 Sprint 7: Achievements (Nov 12-18)
**Objetivo**: Badges y NFTs invisibles

**Tasks**:
- [ ] Galería de badges en perfil
- [ ] Fetch `/api/nfts/me`
- [ ] Animación de unlock (Framer Motion)
- [ ] Share en redes (Open Graph)
- [ ] Tooltips con descripción de logros

**Deliverable**: Sistema de achievements visible

---

### 🛡️ Sprint 8: Validación y UX (Nov 19-25)
**Objetivo**: Manejo de errores y edge cases

**Tasks**:
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Toast notifications (success/error)
- [ ] Manejo de GPS desactivado
- [ ] Manejo de cámara denegada
- [ ] Retry logic en fetch
- [ ] Offline mode (cache misiones)
- [ ] PWA setup (manifest, service worker)

**Deliverable**: App robusta y resiliente

---

### 🚀 Sprint 9: Polish & Launch (Nov 26 - Dec 2)
**Objetivo**: Preparar para producción

**Tasks**:
- [ ] Testing QA completo
- [ ] Optimización de bundle (code splitting)
- [ ] Lazy loading de rutas
- [ ] Analytics (Mixpanel o Amplitude)
- [ ] SEO metadata
- [ ] Deploy a Vercel/Netlify
- [ ] Configurar CI/CD
- [ ] Documentación de componentes

**Deliverable**: App en producción

---

## 🎨 Design System

### Colores (del PRD)
```css
--color-red: #E5533D;    /* Focos */
--color-yellow: #F2B84B; /* Playas */
--color-green: #4CD787;  /* Parques */
--color-blue: #3DA5E5;   /* Ríos */
--color-dark-teal: #1A3A3A; /* Background */
--color-light-teal: #2D5A5A; /* Cards */
```

### Tipografía
```css
--font-primary: 'Inter', sans-serif;
--font-display: 'Poppins', sans-serif;
```

### Pin de Misión (Hoja)
```css
.mission-pin {
  width: 40px;
  height: 40px;
  border-radius: 50% 0 50% 0; /* Forma de hoja */
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.2s;
}
.mission-pin:hover {
  transform: scale(1.1);
}
```

### Responsividad
- **Mobile-first** (viewport base: 375px)
- Breakpoints:
  - `sm`: 640px (tablet)
  - `md`: 768px (landscape tablet)
  - `lg`: 1024px (desktop - para admin dashboard)

---

## 🔗 Integración con Backend

### Base URL
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"
```

### Autenticación (Privy)
```typescript
import { usePrivy } from "@privy-io/react-auth";

const { login, authenticated, user, getAccessToken } = usePrivy();

// En cada request:
const token = await getAccessToken();
fetch(url, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
```

### Endpoints Críticos (TODOS DISPONIBLES ✅)
| Endpoint | Método | Uso | Status |
|----------|--------|-----|--------|
| `/api/auth/privy` | POST | Verificar token Privy | ✅ |
| `/api/missions/nearby` | GET | Mapa de misiones | ✅ |
| `/api/missions/:id` | GET | Detalle de misión | ✅ |
| `/api/missions/:id/claim` | POST | Reclamar misión | ✅ |
| `/api/claims/:id/validate-photos` | POST | Validar ambas fotos | ✅ NEW |
| `/api/claims/:id/upload-before` | POST | Subir foto ANTES | ✅ NEW |
| `/api/claims/:id/upload-after` | POST | Subir foto DESPUÉS | ✅ NEW |
| `/api/claims/me` | GET | Historial de claims | ✅ |
| `/api/points/balance` | GET | Puntos del usuario | ✅ |
| `/api/leaderboard` | GET | Rankings | ✅ |
| `/api/vouchers/catalog` | GET | Productos canjeables | ✅ |
| `/api/vouchers/redeem` | POST | Canjear puntos | ✅ |

---

## 📦 Estructura de Carpetas

```
templates/react/src/
├── assets/           # Imágenes, iconos
├── components/       # Componentes reutilizables
│   ├── auth/         # LoginScreen, PrivyAuthButton
│   ├── map/          # MapScreen, MissionPin, MiniMap
│   ├── missions/     # MissionCard, MissionDetailScreen
│   ├── claims/       # EvidenceCaptureScreen, ClaimHistoryList
│   ├── profile/      # ProfileScreen, UserStatsCard
│   ├── leaderboard/  # LeaderboardTable
│   ├── vouchers/     # VoucherCatalog, QRCodeDisplay
│   └── shared/       # Button, Card, Modal, Toast
├── hooks/            # Custom hooks
│   ├── useAuth.ts    # Privy + Freighter
│   ├── useMissions.ts
│   ├── useClaims.ts
│   ├── usePoints.ts
│   └── useGeolocation.ts
├── stores/           # Zustand stores
│   ├── authStore.ts
│   ├── missionStore.ts
│   └── userStore.ts
├── services/         # API clients
│   ├── api.ts        # Axios instance con auth
│   ├── missions.service.ts
│   ├── claims.service.ts
│   └── vouchers.service.ts
├── utils/            # Helpers
│   ├── stellar.ts    # Stellar SDK helpers
│   ├── geolocation.ts
│   └── imageCompression.ts
├── types/            # TypeScript types
│   ├── mission.ts
│   ├── claim.ts
│   └── user.ts
├── App.tsx
└── main.tsx
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Componentes puros (Button, Card, etc.)
- Utils y helpers
- Zustand stores

### Integration Tests (React Testing Library)
- Flujos completos (login → claim → redeem)
- API mocking (MSW)

### E2E Tests (Playwright)
- Flow crítico: Login → Ver mapa → Reclamar → Enviar evidencias
- Redención de vouchers

---

## 🚧 Bloqueadores y Dependencias

### ✅ Dependencias Backend LISTAS
- [x] **Privy authentication middleware** - Activo en backend
- [x] **Points System API** - `/api/points/*` funcionando
- [x] **Voucher System API** - `/api/vouchers/*` completo
- [x] **Leaderboard API** - `/api/leaderboard` con caché
- [x] **Validator Dashboard API** - `/api/validator/*` operativo
- [x] **Supabase Database** - 10 tablas desplegadas

### ✅ Dependencias Backend COMPLETADAS
- [x] **GPS Missions API** - `/api/missions/nearby` (Sprint 1 COMPLETADO)
- [x] **Claims API with dual photos** - `/api/claims/:id/validate-photos`, `/api/claims/:id/upload-before`, `/api/claims/:id/upload-after` (Sprint 2 COMPLETADO)

### ❌ Dependencias Backend PENDIENTES
- [ ] **IPFS Metadata** - Upload de fotos a IPFS (Sprint 3)

### 🔔 IMPORTANTE para Frontend Team
**Backend ya tiene completo**:
1. Login con Privy (social + embedded wallets)
2. Sistema de puntos (balance, historial, niveles, rachas)
3. Vouchers QR (catálogo, canje, verificación)
4. Leaderboard (rankings, mi posición, cercanos)

**Pueden empezar a implementar**:
- Screen 1: Login con Privy ✅
- Screen 2: Mapa con misiones GPS ✅ (API disponible)
- Screen 3: Detalle de misión ✅ (API disponible)
- Screen 4: Captura de evidencias ✅ (3 endpoints disponibles)
- Screen 5: Perfil (puntos, nivel, vouchers, leaderboard) ✅

**Todas las pantallas principales tienen APIs disponibles**

### Coordinación con Backend Team
- **Doc disponible**: `backend/IMPLEMENTATION_STATUS.md`
- **APIs documentadas**: Ver `backend/src/routes/index.js`
- Slack #backend-dev para dudas
- Shared types: TBD (considerar monorepo)

---

## 🎯 Métricas de Éxito Frontend

### Performance
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size < 500KB (gzipped)

### UX
- Tasa de completación de claim > 80%
- Tiempo promedio de captura de evidencias < 2 min
- Tasa de error en GPS verification < 5%

### Engagement
- DAU/MAU ratio > 20%
- Tiempo promedio en app > 8 min/sesión
- Retención día 7 > 40%

---

## 🔄 Sincronización con Roadmap General

Este roadmap frontend está alineado con:
- **FASE 0** (Rebase): Sprint 0 - Privy integration
- **FASE 1** (MVP Core): Sprints 1-4 - Mapa, claims, perfil
- **FASE 2** (Vouchers): Sprints 5-6 - Redención
- **FASE 3** (Gamification): Sprint 7 - Achievements
- **FASE 5** (Anti-Fraude): Sprint 8 - Validaciones
- **FASE 6** (Producción): Sprint 9 - Launch

---

## 📞 Contacto con Frontend Team

**Nota**: Este roadmap debe ser compartido con el equipo frontend que está construyendo la aplicación. Asegurar:
- Acceso a repositorio `templates/react/`
- Credenciales de Privy (ya en `.env`)
- Acceso a Supabase (cuando esté configurado)
- Canal de Slack/Discord para sync diario

---

**Aprobado por**: Equipo EcoBonus
**Última Actualización**: 2026-09-25
**Próxima Revisión**: 2026-10-22
**Estado**: Backend Sprints 1-2 completados - TODOS los endpoints core disponibles para frontend
