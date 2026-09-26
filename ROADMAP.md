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

## 📊 Estado Actual (Sep 24, 2026) - ACTUALIZADO

### ✅ Infraestructura Construida
- **Smart Contracts en Stellar Testnet**
  - MissionContract: `CAIFF...R47V`
  - RewardContract: `CBUPDKP...G6PO`
  - CertificateNFT: `CCM2NUS...B5LS`
- **Backend API** (Node.js + Express + Supabase)
- **AI Validation Service** (DETR model)
- **Trustless Work integration** (escrow)
- **Supabase Database** (10 tablas desplegadas)
- **Privy Authentication** (social login + embedded wallets)

### ✅ Features Implementadas (NUEVO)
1. **Sistema de Puntos** ✅ - Ledger en Supabase, niveles, rachas
2. **Autenticación Dual** ✅ - Privy (social) + Stellar (wallet opcional)
3. **Vouchers QR** ✅ - Catálogo, canje, expiración
4. **Dashboard Validadores** ✅ - Cola, aprobar/rechazar, stats
5. **Leaderboard** ✅ - Rankings con caché de 5min
6. **Gaming** ✅ - Niveles, XP, rachas, bonos

### ❌ Gaps vs PRD (Pendientes)
1. **Misiones GPS** ✅ - COMPLETADO (PostGIS + API + Testing)
2. **Fotos Before/After** ✅ - COMPLETADO (EXIF GPS + Perceptual Hash)
3. **IPFS Metadata** ❌ - Para RWA certificates
4. **Fee-Sponsored Txs** ❌ - Admin paga gas fees
5. **Soul-Bound NFTs** ❌ - Minteo de certificados

---

## 🗺️ Roadmap por Fases

### 🏗️ FASE 0: Rebase (Sep 24 - Oct 7) ← **75% COMPLETADO** ✅

**Decisión Arquitectónica**: Sistema Híbrido Privy + Supabase + Wallet Opcional
- ❌ NO usar Magic.link
- ✅ Privy para social login (Google/Email)
- ✅ Puntos en database (Supabase), no blockchain
- ✅ Wallet Stellar OPCIONAL (solo para NFTs)

**Semana 1** (Sep 24-30): ✅ COMPLETADO
- [x] Setup Supabase (reemplaza PostgreSQL)
- [x] Integrar Privy authentication (backend)
- [x] Crear schema de base de datos (10 tablas nuevas)
- [x] Trustless Work integration actualizada

**Semana 2** (Oct 1-7): ✅ COMPLETADO
- [x] Implementar Points System (backend)
- [x] Voucher System con QR codes
- [x] Validator Dashboard backend
- [x] Leaderboard con caché

**Pendiente de FASE 0**:
- [ ] Frontend: Login con Privy
- [ ] Frontend: Pantalla de perfil (puntos/nivel)

**Entregable**: Backend completo, frontend pendiente (otro equipo)

---

### 🎯 FASE 1: MVP Core (Oct 8 - Oct 28) ← **PRÓXIMA FASE**
**Objetivo**: Misiones GPS + Validación de fotos dual

**Prioridad**: Alta (Core Feature)

#### Sprint 1: Misiones con GPS (Oct 8-14) ✅ **COMPLETADO (Backend)**
**Backend**:
- [x] SQL function `missions_nearby()` con PostGIS
- [x] API `/api/missions/nearby?lat=X&lon=Y&radius=5000`
- [x] Generar códigos de zona (LM-RIM-0412)
- [x] Trigger GPS distance validation
- [x] Testing completo (459m precision verified)

**Frontend**:
- [ ] MapLibre GL integration (PENDIENTE - otro equipo)
- [ ] Pines personalizados (CSS hoja)
- [ ] Ficha de misión (popup)
- [ ] Filtros: Focos/Ríos/Playas/Parques

#### Sprint 2: Fotos Before/After con GPS (Oct 15-21) ✅ **COMPLETADO (Backend)**
**Backend**:
- [x] Install `exif-parser`, `sharp`, `imghash`, `multer` packages
- [x] Validar coordenadas GPS en EXIF de fotos
- [x] Comparar GPS de fotos vs ubicación de misión (configurable radius)
- [x] Validar timestamp (before < after)
- [x] Perceptual hashing (anti-duplicados) con imghash
- [x] 3 nuevos endpoints: `/api/claims/:id/validate-photos`, `/api/claims/:id/upload-before`, `/api/claims/:id/upload-after`
- [x] Sistema de scoring (0-100 puntos)
- [x] Multer file upload middleware

**Frontend**:
- [ ] Pantalla captura foto ANTES (PENDIENTE - otro equipo)
- [ ] GPS verification UI (círculo 20m)
- [ ] Pantalla captura foto DESPUÉS
- [ ] Input: bolsas recolectadas
- [ ] Envío a validación

#### Sprint 3: IPFS + RWA Metadata (Oct 22-28)
**Backend**:
- [ ] Setup IPFS client (Infura/Pinata)
- [ ] Upload fotos a IPFS
- [ ] Generar metadata JSON (RWA format)
- [ ] Retornar IPFS URI: `ipfs://Qm...`

**Metadata Format**:
```json
{
  "name": "EcoBonus Impact Certificate #123",
  "image": "ipfs://QmAfter.../",
  "properties": {
    "before_photo": "ipfs://QmBefore.../",
    "after_photo": "ipfs://QmAfter.../",
    "gps_coordinates": {"latitude": 20.6274, "longitude": -87.0729},
    "co2_reduced": 50,
    "verified_by": "human_validator"
  }
}
```

**Entregable**: Misiones GPS + Fotos validadas + IPFS metadata

---

### 🎁 FASE 2: Vouchers (Oct 29 - Nov 11) ✅ **COMPLETADO (Backend)**
**Objetivo**: Canje de puntos por productos físicos

#### Sprint 4: Catálogo de Sponsors ✅ COMPLETADO
**Backend**:
- [x] Tabla `sponsor_products` creada
- [x] CRUD de productos (admin)
- [x] API `/api/vouchers/catalog`
- [x] 3 productos de ejemplo insertados

**Frontend**:
- [ ] Pantalla de catálogo (otro equipo)
- [ ] Filtros por categoría

#### Sprint 5: Redemption ✅ COMPLETADO (Backend)
**Backend**:
- [x] API `/api/vouchers/redeem`
- [x] Generar QR único (UUID)
- [x] Deducir puntos
- [x] Control de stock automático
- [x] Sistema de expiración
- [x] Endpoints para tiendas: `/api/vouchers/verify/:qrCode` y `/api/vouchers/redeem-qr`

**Frontend**:
- [ ] Flow de canje (otro equipo)
- [ ] Pantalla QR code
- [ ] Mis vouchers activos

**Smart Contracts**:
- [ ] Deploy VoucherRedeemContract (PENDIENTE - opcional)
- [ ] On-chain proof de canje (PENDIENTE - low priority)

**Entregable**: ✅ Backend completo, frontend pendiente

---

### 🎮 FASE 3: Gamification (Nov 12 - Nov 25) ✅ **COMPLETADO (Backend)**
**Objetivo**: Retención mediante juego

#### Sprint 6: Niveles y Rachas ✅ COMPLETADO
**Backend**:
- [x] Fórmula de niveles: `level = sqrt(experience/100) + 1`
- [x] Sistema de rachas (días consecutivos)
- [x] Bonus por rachas >5 días (+10 pts)
- [x] Trigger automático de actualización de rachas
- [ ] Auto-mint NFT en level-up (PENDIENTE - FASE 4)

**Frontend**:
- [ ] Barra de progreso de nivel
- [ ] "64% al nivel 5"
- [ ] Indicador de racha
- [ ] Animación level-up

#### Sprint 7: Leaderboard ✅ COMPLETADO (Backend)
**Backend**:
- [x] Tabla `leaderboard_cache` creada
- [x] Rankings por: puntos, zonas, bolsas, rachas
- [x] Períodos: daily, weekly, monthly, all_time
- [x] Segmentos: universidad, distrito
- [x] Caché de 5 minutos
- [x] APIs: `/api/leaderboard`, `/api/leaderboard/my-rank`, `/api/leaderboard/surrounding`

**Frontend**:
- [ ] Vista "Top 12 · tu universidad"
- [ ] Pestañas: Semanal/Mensual/All-time
- [ ] Destacar posición del usuario

**Entregable**: ✅ Backend completo, frontend pendiente

---

### 🏆 FASE 4: Soul-Bound NFTs + Fee-Sponsored Txs (Nov 26 - Dec 2) ❌ PENDIENTE
**Objetivo**: Logros on-chain (soul-bound) + Transacciones sponsoreadas

**Prioridad**: Media (Blockchain features)

**Smart Contracts**:
- [ ] Modificar CertificateNFT (non-transferable)
- [ ] Bloquear función `transfer()`
- [ ] Testing en testnet

**Backend - NFT Minting**:
- [ ] Service: `src/services/nft.service.js`
- [ ] Función `mintImpactCertificate(userId, stellarAddress, impactData, metadataURI)`
- [ ] Validar que usuario tenga wallet conectada
- [ ] Auto-mint en hitos:
  - 10 misiones
  - 50 misiones
  - Nivel 5
  - Racha 30 días

**Backend - Fee-Sponsored Transactions**:
- [ ] Service: `src/services/stellar.service.js`
- [ ] Función `sponsorTransaction(userPublicKey, operation)`
- [ ] Admin wallet firma y paga fees
- [ ] Usuario solo aprueba operación

**Frontend**:
- [ ] Galería de badges
- [ ] "Guardián Urbano · Nv. 4"
- [ ] Share en redes
- [ ] Conectar wallet (opcional)

**Entregable**: NFTs soul-bound + fee sponsorship funcionando

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

## 🎯 Próximos 7 Días (Oct 22-28) - **SPRINT ACTUAL**

### Backend (Alta Prioridad)
1. ✅ **SQL function `missions_nearby()`** - COMPLETADO
2. ✅ **Endpoint GPS missions** - COMPLETADO
3. ✅ **Validación de fotos con EXIF GPS** - COMPLETADO
4. **Sprint 3: IPFS + RWA Metadata** - PRÓXIMO

### Frontend (Otro Equipo)
1. Install Privy React SDK
2. Login screen con social options
3. Mapa con misiones cercanas
4. Captura de fotos dual

### Documentation
1. ✅ `IMPLEMENTATION_STATUS.md` creado
2. Actualizar OpenAPI spec
3. Compartir con frontend team

---

**Última Actualización**: 2026-09-25
**Próxima Revisión**: 2026-10-22
**Estado**: FASE 0 completada (100%), FASE 1 Sprint 1-2 completados (Backend), FASE 1 Sprint 3 próximo
