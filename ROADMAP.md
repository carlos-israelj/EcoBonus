# EcoBonus - Roadmap de Desarrollo

## Fase Actual: MVP para Hackathon

### Estado del Proyecto ✅

**Actualizado**: 2026-09-23 17:10 UTC

#### Smart Contracts Completados
- [x] **MissionContract** implementado y compilado (mission_contract.wasm - 13KB)
  - Creación de misiones geolocalizadas
  - Sistema de claims con validación GPS
  - Integración con RewardContract
  - Tests implementados
- [x] **RewardContract** implementado y compilado (reward_contract.wasm - 12KB)
  - Pools de recompensas en USDC
  - Sistema de validación de claims
  - Distribución automática de recompensas
  - Integración con oracle/IA
  - Tests implementados
- [x] **CertificateNFT** implementado y compilado (certificate_nft.wasm - 12.7KB)
  - Minteo de certificados de impacto como NFTs
  - Marketplace B2B funcional
  - Sistema de burn para carbon offsetting
  - Tracking de impacto por usuario
  - Tests implementados y actualizados para SDK v27

#### Backend Completado
- [x] **API REST (Node.js/Express)** - 17 archivos, 1,724 líneas
  - Endpoints para missions, claims, users
  - Integración con Stellar SDK
  - Servicio IPFS para almacenamiento de evidencia
  - Schema PostgreSQL completo con analytics
  - Middleware de autenticación
  - Logging con Winston

- [x] **AI Validation Service (Python/Flask)** - 13 archivos, 1,356 líneas
  - Detección de objetos con DETR (Facebook)
  - Clasificación en 7 categorías de residuos
  - Validación de ubicación GPS mediante EXIF
  - Estimación de peso
  - Sistema de scoring anti-fraude
  - API REST con autenticación

#### Infraestructura Técnica
- [x] Repositorio GitHub configurado
- [x] Scaffold Stellar inicializado
- [x] Análisis de competidores completo (STRATEGY.md)
- [x] Arquitectura técnica diseñada (ARCHITECTURE.md)
- [x] Colaboradores agregados (@candeluisa, @jorgeabrilpino-hash)
- [x] Todos los contratos compilan exitosamente a WASM
- [x] Correcciones para Soroban SDK v27.0.6
- [x] Sistema de builds con stellar CLI configurado

#### Estadísticas del Proyecto
```
Smart Contracts: 3 contratos (38KB WASM total)
Rust Files: 26 archivos fuente
Backend API: 30+ endpoints REST
Database: 7 tablas PostgreSQL + vistas materializadas
AI Models: DETR + validación GPS
Total Code: ~3,500+ líneas (Rust + JS + Python)
```

---

## Próximos Pasos Inmediatos

### 1. Smart Contracts (Soroban/Rust) 🔨

#### 1.1 RewardContract ✅ COMPLETADO
**Tiempo real**: 3 días (incluyendo correcciones SDK)

**Tareas Completadas**:
- [x] Crear estructura del contrato `contracts/reward-contract/`
- [x] Implementar tipos de datos:
  ```rust
  struct RewardPool {
      sponsor: Address,
      token_address: Address,  // USDC contract
      total_funded: i128,
      total_distributed: i128,
      available_balance: i128,
  }

  struct Claim {
      id: u64,
      mission_id: u64,
      claimer: Address,
      amount: i128,
      status: ClaimStatus,  // Pending, Approved, Rejected
      proof_uri: String,
      timestamp: u64,
  }
  ```
- [x] Funciones principales implementadas:
  - [x] `create_pool()` - Crear pool de recompensas
  - [x] `fund_pool()` - Financiar pool con USDC
  - [x] `submit_claim()` - Enviar claim de usuario
  - [x] `validate_claim()` - Validar claim (por oracle/admin)
  - [x] `distribute_reward()` - Transferir USDC a usuario
  - [x] `get_pool_stats()` - Estadísticas del pool
- [ ] Sistema de validación:
  - Integración con oráculo IA
  - Fallback a validación manual
  - Timeouts para claims pendientes
- [ ] Tests unitarios:
  - Crear pool
  - Fondear pool
  - Submit y aprobar claim
  - Distribuir recompensa
  - Rechazar claim inválido
- [ ] Integración con MissionContract

**Entregables**:
- Código del contrato compilable
- Suite de tests pasando
- Documentación de funciones

---

#### 1.2 CertificateNFT (Prioridad: MEDIA)
**Tiempo estimado**: 1-2 días

**Tareas**:
- [ ] Crear estructura del contrato `contracts/certificate-nft/`
- [ ] Implementar estándar NFT compatible con Stellar
- [ ] Tipos de datos:
  ```rust
  struct ImpactCertificate {
      token_id: u64,
      owner: Address,
      mission_id: u64,
      claim_id: u64,
      location: Location,
      timestamp: u64,
      weight_kg: Option<u32>,
      category: WasteCategory,
      proof_uri: String,  // IPFS
      carbon_offset: Option<u32>,
  }
  ```
- [x] Funciones principales implementadas:
  - `mint_certificate()` - Mintear NFT al completar claim
  - `transfer()` - Transferir certificado
  - `burn()` - Quemar (para compensación corporativa)
  - `get_certificate()` - Obtener metadata
  - `get_user_certificates()` - Certificados de un usuario
  - `list_for_sale()` - Listar en marketplace B2B
  - `buy_certificate()` - Comprar certificado
- [ ] Metadata en IPFS:
  - Diseñar estructura JSON estándar
  - Incluir imágenes de evidencia
  - GPS + timestamp + categoría
- [ ] Tests:
  - Minteo automático
  - Transferencias
  - Marketplace básico

**Entregables**:
- Contrato NFT funcional
- Tests pasando
- Ejemplos de metadata

---

#### 1.3 LeaderboardContract (Prioridad: BAJA - Post-Hackathon)
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Sistema de puntos y niveles
- [ ] Ligas (Bronze, Silver, Gold, Platinum, Diamond)
- [ ] Rankings local/nacional
- [ ] Multiplicadores de recompensa
- [ ] Rachas (streaks)

**Puede ser diferido** para después del hackathon si el tiempo es limitado.

---

### 2. Backend Services (Node.js/Python) 🔧

#### 2.1 API Backend (Node.js/Express)
**Tiempo estimado**: 2-3 días

**Tareas**:
- [ ] Configurar Express server
- [ ] Endpoints principales:
  ```
  GET  /api/missions/nearby?lat=X&lon=Y&radius=Z
  GET  /api/missions/:id
  POST /api/missions/create (admin/sponsor)
  GET  /api/claims/user/:address
  GET  /api/leaderboard/:league
  POST /api/claims/:id/validate (oracle)
  ```
- [ ] Integración con contratos Soroban:
  - Inicializar Stellar SDK
  - Wrapper functions para contratos
  - Event listeners (Soroban RPC)
- [ ] Base de datos PostgreSQL:
  - Schema para cache de misiones
  - Indexación de eventos blockchain
  - Metadata off-chain
- [ ] Autenticación:
  - Verificación de firma de wallet
  - Roles (admin, sponsor, oracle, user)
- [ ] CORS y seguridad básica

**Entregables**:
- API REST funcional
- Documentación Swagger/OpenAPI
- Docker Compose para desarrollo local

---

#### 2.2 Servicio de Validación IA (Python)
**Tiempo estimado**: 3-4 días

**Tareas**:
- [ ] Configurar entorno Python:
  - FastAPI
  - TensorFlow/PyTorch
  - OpenCV
  - Pillow
- [ ] Modelo de clasificación de basura:
  - Dataset: TrashNet, TACO, o similar
  - Categorías: Plastic, Glass, Paper, Metal, Organic, Mixed
  - Fine-tuning de modelo pre-entrenado (MobileNet, EfficientNet)
  - Accuracy objetivo: >80%
- [ ] Endpoints:
  ```python
  POST /api/ai/validate
  {
    "image": base64,
    "latitude": float,
    "longitude": float,
    "mission_id": int
  }

  Response:
  {
    "valid": boolean,
    "category": string,
    "confidence": float,
    "estimated_weight_kg": float,
    "proof_uri": string  // IPFS hash
  }
  ```
- [ ] Validaciones:
  - GPS dentro del radio de misión
  - Timestamp reciente (< 5 minutos)
  - Confianza del modelo > 70%
  - Detección de duplicados (hashing)
- [ ] Integración con IPFS:
  - Subir imagen + metadata
  - Generar hash para proof_uri
- [ ] Optimizaciones:
  - Modelo cuantizado para inferencia rápida
  - Batch processing
  - Cache de resultados

**Entregables**:
- API de validación funcional
- Modelo entrenado (.h5 o .pt)
- Documentación de endpoints
- Métricas de accuracy

---

### 3. Frontend MVP (React + TypeScript) 🎨

#### 3.1 Configuración Base
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Configurar estructura de carpetas:
  ```
  src/
  ├── components/
  │   ├── Map/
  │   ├── Mission/
  │   ├── Camera/
  │   ├── Wallet/
  │   └── Leaderboard/
  ├── contracts/  (auto-generated clients)
  ├── hooks/
  ├── pages/
  ├── services/
  ├── types/
  └── utils/
  ```
- [ ] Instalar dependencias:
  ```bash
  npm install @stellar/stellar-sdk
  npm install @stellar/freighter-api
  npm install mapbox-gl react-map-gl
  npm install @tanstack/react-query
  npm install zustand
  npm install react-camera-pro
  ```
- [ ] Configurar Tailwind CSS + Stellar Design System
- [ ] Setup de React Query para cache
- [ ] Zustand stores para estado global

---

#### 3.2 Integración con Wallet
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Componente `WalletButton`:
  - Conectar con Freighter
  - Mostrar dirección acortada
  - Balance XLM/USDC
  - Botón disconnect
- [ ] Hook `useWallet`:
  ```typescript
  const {
    isConnected,
    address,
    connect,
    disconnect,
    signTransaction
  } = useWallet()
  ```
- [ ] Integración con contratos:
  ```typescript
  // Auto-generados por Stellar Scaffold
  import { MissionContractClient } from '../contracts/mission-contract'
  import { RewardContractClient } from '../contracts/reward-contract'
  ```
- [ ] Manejo de errores y estados de carga

---

#### 3.3 Mapa de Misiones
**Tiempo estimado**: 2 días

**Tareas**:
- [ ] Componente `MissionMap`:
  - Integración Mapbox
  - Centrado en ubicación del usuario
  - Pins de misiones activas
  - Clusters para múltiples misiones cercanas
- [ ] Filtros:
  - Por categoría de basura
  - Por recompensa
  - Por distancia
- [ ] Popup al hacer click en pin:
  - Preview de misión
  - Distancia estimada
  - Recompensa
  - Slots disponibles
  - Botón "Ver detalles"
- [ ] Navegación:
  - Integrar con Google Maps / Waze
  - Mostrar ruta al punto

**Ejemplo**:
```tsx
<MissionMap
  center={userLocation}
  missions={nearbyMissions}
  onMissionSelect={(mission) => navigate(`/mission/${mission.id}`)}
/>
```

---

#### 3.4 Pantalla de Detalle de Misión
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Componente `MissionDetail`:
  - Galería de fotos "antes" (desde IPFS)
  - Descripción completa
  - Mapa con ubicación exacta
  - Recompensa + slots
  - Deadline countdown
  - Botón "Aceptar Misión"
- [ ] Validaciones:
  - Usuario no ha reclamado antes
  - Misión está activa
  - Quedan slots disponibles
- [ ] Navegación a cámara

---

#### 3.5 Cámara y Validación
**Tiempo estimado**: 2 días

**Tareas**:
- [ ] Componente `CameraCapture`:
  - Acceso a cámara del dispositivo
  - Preview en tiempo real
  - Captura de foto
  - Recaptura si no satisface
- [ ] Validación en tiempo real (opcional):
  - Llamada al API IA mientras el usuario está en el lugar
  - Feedback inmediato si la foto no es válida
- [ ] Componente `PhotoReview`:
  - Preview de foto capturada
  - Datos GPS + timestamp
  - Botón "Enviar Claim"
  - Loading state durante validación
- [ ] Integración con smart contract:
  ```typescript
  const handleSubmitClaim = async () => {
    // 1. Validar con IA
    const validation = await validatePhoto(photo, gps)

    if (!validation.valid) {
      showError(validation.reason)
      return
    }

    // 2. Subir a IPFS (via backend)
    const proofUri = validation.proof_uri

    // 3. Llamar a claim_mission()
    const tx = await missionContract.claim_mission({
      mission_id,
      claimer: address,
      proof_uri: proofUri
    })

    // 4. Esperar confirmación
    await tx.wait()

    showSuccess("¡Claim enviado! Esperando validación final.")
  }
  ```

---

#### 3.6 Dashboard de Usuario
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Componente `UserDashboard`:
  - Balance USDC/XLM
  - Total ganado
  - Misiones completadas
  - Nivel y XP
  - Racha actual
- [ ] Lista de claims:
  - Pendientes
  - Aprobados
  - Rechazados (con razón)
- [ ] Galería de NFTs certificados:
  - Grid de certificados
  - Modal con detalles
  - Botón "Ver en explorador"
- [ ] Historial de transacciones:
  - Claims recientes
  - Recompensas recibidas
  - Link a Stellar Explorer

---

#### 3.7 Leaderboard
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Componente `Leaderboard`:
  - Tabs por liga (Bronze, Silver, Gold, etc.)
  - Ranking top 100
  - Highlight del usuario actual
- [ ] Componente `UserCard`:
  - Avatar (generado por dirección)
  - Nombre de usuario (opcional)
  - Posición
  - Puntos totales
  - Badges/logros
- [ ] Filtros:
  - Local (por ciudad)
  - Nacional
  - Global

---

### 4. Integración y Testing 🧪

#### 4.1 Despliegue en Testnet
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Compilar contratos:
  ```bash
  stellar contract build
  ```
- [ ] Desplegar a Testnet:
  ```bash
  stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/mission_contract.wasm \
    --network testnet
  ```
- [ ] Inicializar contratos:
  - MissionContract.initialize(admin)
  - RewardContract.create_pool(sponsor, USDC_TESTNET_ADDRESS, initial_funds)
- [ ] Generar TypeScript clients:
  ```bash
  stellar contract bindings typescript \
    --contract-id CXXXXX \
    --output-dir src/contracts/
  ```
- [ ] Configurar `.env`:
  ```
  VITE_NETWORK=testnet
  VITE_MISSION_CONTRACT_ID=CXXXXX
  VITE_REWARD_CONTRACT_ID=CXXXXX
  VITE_CERTIFICATE_CONTRACT_ID=CXXXXX
  VITE_USDC_CONTRACT_ID=CXXXXX
  ```

---

#### 4.2 Testing End-to-End
**Tiempo estimado**: 2 días

**Tareas**:
- [ ] Crear cuentas de prueba en Testnet:
  - Admin
  - Sponsor
  - 5 usuarios test
- [ ] Fondear cuentas con XLM (Friendbot)
- [ ] Fondear sponsor con USDC testnet
- [ ] Flujo completo de prueba:
  1. Admin despliega contratos
  2. Sponsor crea pool de recompensas
  3. Sponsor crea misión geolocalizada en Lima
  4. Usuario 1 descubre misión en mapa
  5. Usuario 1 va al lugar (simular GPS)
  6. Usuario 1 toma foto
  7. IA valida foto
  8. Usuario 1 envía claim
  9. Oracle/Admin aprueba claim
  10. USDC transferido a Usuario 1
  11. NFT certificado minteado
  12. Verificar en Stellar Explorer
- [ ] Capturar screenshots/video de cada paso
- [ ] Documentar issues encontrados

---

#### 4.3 Testing de Contratos
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Ejecutar suite de tests:
  ```bash
  cargo test --package mission-contract
  cargo test --package reward-contract
  cargo test --package certificate-nft
  ```
- [ ] Tests de integración entre contratos
- [ ] Tests de edge cases:
  - Misión con deadline expirado
  - Claim después de slots llenos
  - Doble claim del mismo usuario
  - Retirar fondos de pool vacío
- [ ] Code coverage > 80%

---

### 5. Datos de Demo y Contenido 📊

#### 5.1 Misiones de Ejemplo en Lima
**Tiempo estimado**: 0.5 días

**Tareas**:
- [ ] Crear 10-15 misiones de ejemplo:
  - Parque Kennedy, Miraflores (-12.118893, -77.029572)
  - Costa Verde (-12.132778, -77.019167)
  - Plaza San Martín (-12.047372, -77.030152)
  - Parque de la Reserva (-12.070556, -77.036111)
  - Universidad de Lima (-12.084722, -76.971667)
  - Etc.
- [ ] Fotos "antes" de cada ubicación:
  - Buscar en Google Images
  - Usar dataset de basura urbana
  - Subir a IPFS
- [ ] Fondear con recompensas realistas:
  - 0.5 - 2 USDC por claim
  - 5-20 slots por misión

---

#### 5.2 Dataset de Entrenamiento IA
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Descargar datasets públicos:
  - TrashNet (2500 imágenes, 6 categorías)
  - TACO (1500 imágenes anotadas)
  - Kaggle Waste Classification
- [ ] Aumentar datos:
  - Rotaciones, flips, brightness
  - 5000-10000 imágenes total
- [ ] Split: 70% train, 20% val, 10% test
- [ ] Entrenar modelo base
- [ ] Evaluar accuracy en test set

---

### 6. Documentación para Hackathon 📝

#### 6.1 README Actualizado
**Tiempo estimado**: 0.5 días

**Tareas**:
- [ ] Actualizar README.md con:
  - Logo/Banner del proyecto
  - Demo video embed
  - Screenshots de la app
  - Instrucciones de instalación
  - Arquitectura (diagrama)
  - Links a contratos en Explorer
  - Datos del equipo
- [ ] Badge de estado de build
- [ ] Link a presentación del hackathon

---

#### 6.2 Pitch Deck
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Slides (10-15):
  1. Problema (contaminación urbana en Perú)
  2. Solución (Clean-to-Earn + RWA)
  3. Cómo funciona (flujo de usuario)
  4. Tecnología (Stellar/Soroban + IA)
  5. Ventaja competitiva (vs Reciclos, Ecoins, etc.)
  6. Modelo de negocio (B2C + B2B + B2G)
  7. Impacto social y ambiental
  8. Roadmap
  9. Equipo
  10. Demo / Call to action
- [ ] Diseño visual atractivo (Canva/Figma)
- [ ] Exportar a PDF

---

#### 6.3 Video Demo
**Tiempo estimado**: 1 día

**Tareas**:
- [ ] Script del video (2-3 minutos):
  - Problema
  - Solución
  - Demo end-to-end en app
  - Verificación on-chain
  - Call to action
- [ ] Grabar pantalla de app:
  - Conectar wallet
  - Ver mapa de misiones
  - Aceptar misión
  - Navegar al lugar
  - Tomar foto
  - Validación IA
  - Recibir recompensa
  - Ver NFT certificado
- [ ] Voiceover o subtítulos
- [ ] Editar con transiciones
- [ ] Subir a YouTube/Vimeo

---

### 7. Preparación Pre-Hackathon ⚡

#### 7.1 Checklist Final
**Tiempo estimado**: 0.5 días

**Tareas**:
- [ ] Todos los contratos desplegados en Testnet
- [ ] Frontend hosteado (Vercel/Netlify)
- [ ] Backend hosteado (Railway/Render)
- [ ] Servicio IA hosteado (Hugging Face Spaces)
- [ ] Datos de demo cargados
- [ ] Video demo subido
- [ ] Pitch deck finalizado
- [ ] README completo con links
- [ ] Repositorio público y organizado
- [ ] Issues conocidos documentados
- [ ] Plan de contingencia para demo en vivo

---

## Timeline Sugerido

### Semana 1: Smart Contracts + Backend Core
- Días 1-3: RewardContract
- Días 4-5: CertificateNFT
- Días 6-7: Backend API + DB setup

### Semana 2: IA + Frontend Core
- Días 1-3: Servicio de validación IA
- Días 4-5: Integración wallet + mapa de misiones
- Días 6-7: Cámara + validación + submit claim

### Semana 3: Frontend Polish + Integración
- Días 1-2: Dashboard de usuario + leaderboard
- Días 3-4: Testing end-to-end en Testnet
- Días 5: Datos de demo + contenido
- Días 6-7: Documentación + pitch deck

### Semana 4: Preparación Final
- Días 1-2: Video demo
- Día 3: Hosting de servicios
- Día 4: Testing final
- Día 5: Buffer para bugs de último minuto
- Días 6-7: Práctica de presentación

---

## Recursos Útiles

### Tutoriales y Documentación
- [Soroban Docs](https://soroban.stellar.org/docs)
- [Stellar SDK TypeScript](https://github.com/stellar/js-stellar-sdk)
- [Freighter Wallet API](https://docs.freighter.app/)
- [Stellar Testnet Faucet](https://laboratory.stellar.org/#account-creator?network=test)

### Datasets IA
- [TrashNet](https://github.com/garythung/trashnet)
- [TACO Dataset](http://tacodataset.org/)
- [Kaggle Waste Classification](https://www.kaggle.com/datasets/techsash/waste-classification-data)

### Herramientas
- [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/explorer/testnet)
- [Postman](https://www.postman.com/) (testing API)

---

## Criterios de Éxito para Hackathon

### Must-Have (Crítico)
- [x] Contratos desplegados en Testnet funcionando
- [ ] Frontend funcional con flujo end-to-end completo
- [ ] Validación IA operativa (aunque sea básica)
- [ ] Demo en video de calidad
- [ ] Pitch deck profesional
- [ ] Código en GitHub público y documentado

### Nice-to-Have (Deseable)
- [ ] LeaderboardContract implementado
- [ ] Marketplace B2B de certificados
- [ ] Dashboard admin para sponsors
- [ ] Modelo IA con >85% accuracy
- [ ] PWA instalable en móvil
- [ ] Tests de integración completos

### Wow-Factor (Diferenciador)
- [ ] Demo en vivo funcionando sin fallos
- [ ] Datos reales de Lima cargados
- [ ] Integración con wallet móvil (Freighter)
- [ ] Animaciones y UX pulida
- [ ] Métricas de impacto social proyectadas
- [ ] Alianza preliminar con municipalidad/sponsor

---

## Notas Importantes

1. **Priorizar MVP Funcional**: Es mejor tener un flujo completo simple que muchas features incompletas.

2. **Testing Continuo**: Probar en Testnet desde el día 1, no esperar al final.

3. **Documentar Todo**: Cada decisión técnica, cada bug encontrado, cada workaround.

4. **Git Flow**: Commits frecuentes con mensajes descriptivos, branches para features grandes.

5. **Backup Plan**: Tener plan B si la IA no funciona bien (validación manual por admin).

6. **Performance**: Optimizar imágenes, lazy loading, code splitting para que la demo sea rápida.

7. **Mobile-First**: Mayoría de usuarios usarán móvil, probar en dispositivos reales.

8. **Compliance**: Asegurar que metadata de GPS no exponga información sensible de usuarios.

---

## Contacto y Soporte

**Equipo EcoBonus**:
- GitHub: https://github.com/carlos-israelj/EcoBonus
- Colaboradores:
  - @candeluisa
  - @jorgebrilpino-hash

**Recursos Stellar**:
- [Discord Stellar Developers](https://discord.gg/stellardev)
- [Stack Overflow tag:stellar](https://stackoverflow.com/questions/tagged/stellar)
- [Stellar Community Forum](https://community.stellar.org/)

---

**Última actualización**: 2026-09-23
**Versión**: 1.0
