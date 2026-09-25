# EcoBonus - Roadmap General

**Versión**: 2.0 (Post-Gap Analysis)
**Última Actualización**: 2026-09-24
**Basado en**: `docs/prd-ecobonus.docx` + `PRODUCT_GAP_ANALYSIS_FINAL.md`

---

## 🎯 Visión del Producto

**EcoBonus** es una plataforma Clean-to-Earn que incentiva la limpieza urbana mediante **puntos canjeables** por productos reales.

**NO** es una plataforma de crypto trading.
**SÍ** es un sistema de **Proof-of-Impact** con registro verificable en Stellar.

### Propuesta de Valor
> "Limpia tu ciudad, gana puntos ECO, canjea por productos reales. Cada limpieza verificada on-chain."

---

## 📊 Estado Actual (Sep 24, 2026)

### ✅ Infraestructura Construida
- Smart Contracts en Stellar Testnet
  - MissionContract: `CAIFF...R47V`
  - RewardContract: `CBUPDKP...G6PO`
  - CertificateNFT: `CCM2NUS...B5LS`
- Backend API (Node.js + Express)
- AI Validation Service (DETR model)
- Trustless Work integration (escrow)

### ❌ Gaps vs PRD (Críticos)
1. **No hay sistema de puntos** - Distribuimos XLM directo
2. **No hay autenticación Privy** - Solo Stellar wallets
3. **No hay mapa interactivo** - Falta UI de descubrimiento
4. **No hay validación manual** - Solo AI auto-approval
5. **No hay catálogo de vouchers** - Core feature missing
6. **No hay gaming** (niveles/rachas/leaderboard)
7. **Solo 1 foto** - PRD requiere antes/después

---

## 🗺️ Roadmap por Fases

### 🏗️ FASE 0: Rebase (Sep 24 - Oct 7) ← ACTUAL
**Objetivo**: Migrar a arquitectura PRD-compliant

**Semana 1** (Sep 24-30):
- [ ] Setup Supabase (reemplaza PostgreSQL)
- [ ] Integrar Privy authentication (backend + frontend)
- [ ] Crear schema de base de datos (10 tablas nuevas)
- [ ] Documentar APIs (OpenAPI spec)

**Semana 2** (Oct 1-7):
- [ ] Implementar Points System (backend)
- [ ] Migrar storage a Supabase
- [ ] Frontend: Login con Privy
- [ ] Frontend: Pantalla de perfil (puntos/nivel)

**Entregable**: Sistema de puntos funcionando, auth social activa

---

### 🎯 FASE 1: MVP Core (Oct 8 - Oct 28)
**Objetivo**: Flujo end-to-end usuario → misión → validación → puntos

#### Sprint 1: Mapa y Misiones (Oct 8-14)
**Backend**:
- [ ] API `/api/missions/nearby` (geo-queries)
- [ ] Generar códigos de zona (LM-RIM-0412)
- [ ] Endpoint de misión por ID

**Frontend**:
- [ ] MapLibre GL integration
- [ ] Pines personalizados (CSS hoja)
- [ ] Ficha de misión (popup)
- [ ] Filtros: Focos/Ríos/Playas/Parques

#### Sprint 2: Evidencia Dual (Oct 15-21)
**Backend**:
- [ ] Endpoint `/api/claims` (2 fotos + GPS + bags)
- [ ] Upload a Supabase Storage
- [ ] Perceptual hashing (anti-duplicados)
- [ ] AI validation (ambas fotos)

**Frontend**:
- [ ] Pantalla captura foto ANTES
- [ ] GPS verification UI
- [ ] Pantalla captura foto DESPUÉS
- [ ] Input: bolsas recolectadas
- [ ] Envío a validación

#### Sprint 3: Validación Manual (Oct 22-28)
**Backend**:
- [ ] API `/api/claims/pending` (cola)
- [ ] Endpoints approve/reject
- [ ] Trustless Work manual trigger
- [ ] Award points logic

**Frontend (Admin Dashboard)**:
- [ ] Lista de claims pendientes
- [ ] Galería de fotos
- [ ] Botones Aprobar/Rechazar
- [ ] Supabase Realtime (notificaciones)

**Entregable**: Usuario puede completar misión y recibir puntos tras validación manual

---

### 🎁 FASE 2: Vouchers (Oct 29 - Nov 11)
**Objetivo**: Canje de puntos por productos físicos

#### Sprint 4: Catálogo de Sponsors (Oct 29 - Nov 4)
**Backend**:
- [ ] Tabla `sponsors` + `sponsor_products`
- [ ] CRUD de productos (admin)
- [ ] API `/api/vouchers/catalog`

**Frontend**:
- [ ] Pantalla de catálogo
  - Arroz 1kg = 250 pts
  - Aceite 1L = 300 pts
  - Útiles = 180 pts
- [ ] Filtros por categoría

#### Sprint 5: Redemption (Nov 5-11)
**Backend**:
- [ ] API `/api/vouchers/redeem`
- [ ] Generar QR único
- [ ] VoucherRedeemContract.redeem()
- [ ] Deducir puntos

**Frontend**:
- [ ] Flow de canje
- [ ] Pantalla QR code
- [ ] Mis vouchers activos

**Smart Contracts**:
- [ ] Deploy VoucherRedeemContract
- [ ] On-chain proof de canje

**Entregable**: Usuario puede canjear puntos por voucher con QR

---

### 🎮 FASE 3: Gamification (Nov 12 - Nov 25)
**Objetivo**: Retención mediante juego

#### Sprint 6: Niveles y Rachas (Nov 12-18)
**Backend**:
- [ ] Fórmula de niveles (XP → Level)
- [ ] Sistema de rachas (días consecutivos)
- [ ] Bonus por rachas >5 días
- [ ] Auto-mint NFT en level-up

**Frontend**:
- [ ] Barra de progreso de nivel
- [ ] "64% al nivel 5"
- [ ] Indicador de racha
- [ ] Animación level-up

#### Sprint 7: Leaderboard (Nov 19-25)
**Backend**:
- [ ] Tabla `leaderboard_cache`
- [ ] Rankings: universidad, distrito, nacional
- [ ] Cron job (actualizar cada hora)

**Frontend**:
- [ ] Vista "Top 12 · tu universidad"
- [ ] Pestañas: Semanal/Mensual/All-time
- [ ] Destacar posición del usuario

**Entregable**: Sistema completo de gamification funcionando

---

### 🏆 FASE 4: NFT Achievements (Nov 26 - Dec 2)
**Objetivo**: Logros on-chain (soul-bound)

**Smart Contracts**:
- [ ] Modificar CertificateNFT (non-transferable)
- [ ] Bloquear función `transfer()`

**Backend**:
- [ ] Auto-mint en hitos:
  - 10 misiones
  - 50 misiones
  - Nivel 5
  - Racha 30 días

**Frontend**:
- [ ] Galería de badges
- [ ] "Guardián Urbano · Nv. 4"
- [ ] Share en redes

**Entregable**: NFTs de logros (non-transferable) funcionando

---

### 🔒 FASE 5: Anti-Fraude (Dec 3 - Dec 9)
**Objetivo**: Prevenir gaming del sistema

**Backend**:
- [ ] Perceptual hashing (detectar duplicados)
- [ ] Rate limiting (max 10 claims/día)
- [ ] Sistema de reputación de validadores
- [ ] Detección de GPS spoofing

**Frontend**:
- [ ] Advertencia si foto duplicada
- [ ] Límite diario visible

**Entregable**: Sistema robusto anti-fraude activo

---

### 🌐 FASE 6: Producción (Dec 10 - Dec 31)
**Objetivo**: Mainnet launch

#### Pre-Launch
- [ ] Desplegar contratos en Mainnet
- [ ] KYC light (phone verification)
- [ ] Partnerships tiendas (Tottus, Metro)
- [ ] Testing QA completo

#### Launch
- [ ] Piloto: Lima (100 usuarios)
- [ ] Onboarding de 5 sponsors
- [ ] 10 validadores activos

#### Post-Launch
- [ ] Multi-validator (2 de 3)
- [ ] Conversión USDC/XLM
- [ ] Vibrant integration (off-ramp)
- [ ] Expansión: CDMX, Bogotá

**Entregable**: Sistema en producción con usuarios reales

---

## 📈 Métricas de Éxito

### MVP (Mes 1-2)
- 500 usuarios registrados
- 2,500 misiones completadas
- 5 sponsors activos
- 10 toneladas removidas
- 90% approval rate

### Growth (Mes 3-6)
- 10,000 usuarios
- 50,000 misiones
- 20 sponsors
- 100 toneladas
- 3 ciudades

### Scale (Mes 7-12)
- 100,000 usuarios
- 500,000 misiones
- 100 sponsors
- 1,000 toneladas
- 10 ciudades / 3 países

---

## 🔗 Roadmaps Detallados

- **Backend**: Ver `ROADMAP_BACKEND.md`
- **Frontend**: Ver `ROADMAP_FRONTEND.md`
- **Smart Contracts**: Ver sección en cada roadmap

---

## 🚧 Bloqueadores Conocidos

1. **Supabase setup** - Bloqueador para toda FASE 0
2. **Privy integration** - Bloqueador para auth
3. **Frontend team bandwidth** - Coordinación necesaria
4. **Sponsor partnerships** - Crítico para FASE 2

---

## 🎯 Próximos 7 Días (Sep 24-30)

### Backend
1. Setup Supabase project
2. Run SQL schema (10 tables)
3. Integrate Privy auth middleware
4. Points System API (`/api/points/*`)

### Frontend
1. Install Privy React SDK
2. Login screen con social options
3. Profile screen (puntos/nivel)
4. MapLibre GL spike

### Documentation
1. OpenAPI spec para backend APIs
2. Frontend component library doc
3. Database ER diagram

---

**Aprobado por**: Equipo EcoBonus
**Próxima Revisión**: 2026-10-01
**Estado**: FASE 0 en progreso
