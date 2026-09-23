# EcoBonus - Arquitectura Técnica

## Stack Tecnológico

### Blockchain Layer (Stellar/Soroban)
- **Network**: Stellar Testnet → Mainnet
- **Smart Contracts**: Soroban (Rust)
- **Assets**: XLM (gas), USDC (rewards), Custom NFTs (certificates)

### Backend Services
- **API Gateway**: Node.js / Express
- **Database**: PostgreSQL (off-chain metadata)
- **File Storage**: IPFS (images, proofs)
- **AI/ML**: Python (TensorFlow/PyTorch)

### Frontend
- **Framework**: React + TypeScript + Vite
- **Wallet Integration**: Freighter, Albedo
- **Maps**: Mapbox / Google Maps API
- **State Management**: React Query + Zustand
- **Styling**: Tailwind CSS + Stellar Design System

## Arquitectura de Smart Contracts

### Contract 1: MissionContract
**Propósito**: Gestión del ciclo de vida de misiones de limpieza

```rust
pub struct Mission {
    id: u64,
    creator: Address,          // Gobierno/Patrocinador que crea la misión
    location: Location,         // GPS coordinates
    reward_amount: i128,        // En USDC
    status: MissionStatus,      // Pending, Active, Completed, Expired
    max_claimers: u32,          // Máximo de personas que pueden reclamar
    current_claimers: u32,
    evidence_required: u8,      // Número de fotos requeridas
    deadline: u64,              // Timestamp
    metadata_uri: String,       // IPFS link a descripción, fotos "antes"
}

pub enum MissionStatus {
    Pending,    // Creada pero no fondeada
    Active,     // Fondeada y aceptando claims
    Completed,  // Todos los claims procesados
    Expired,    // Deadline pasó
}

pub struct Location {
    latitude: i64,   // Fixed point (lat * 1e6)
    longitude: i64,  // Fixed point (lon * 1e6)
    radius: u32,     // Metros, define el área de validación
}
```

**Funciones principales**:
```rust
// Admin/Sponsor functions
fn create_mission(creator: Address, location: Location, reward: i128, max_claimers: u32) -> u64
fn fund_mission(mission_id: u64, amount: i128) -> Result<(), Error>
fn cancel_mission(mission_id: u64) -> Result<(), Error>

// User functions
fn claim_mission(mission_id: u64, claimer: Address, proof_uri: String) -> Result<u64, Error>
fn get_mission(mission_id: u64) -> Mission
fn get_active_missions_near(lat: i64, lon: i64, radius: u32) -> Vec<Mission>
```

---

### Contract 2: RewardContract
**Propósito**: Gestión del pool de fondos y distribución de recompensas

```rust
pub struct RewardPool {
    sponsor: Address,
    token_address: Address,    // USDC contract address
    total_funded: i128,
    total_distributed: i128,
    available_balance: i128,
    is_active: bool,
}

pub struct Claim {
    id: u64,
    mission_id: u64,
    claimer: Address,
    amount: i128,
    status: ClaimStatus,
    submitted_at: u64,
    proof_uri: String,         // IPFS hash con fotos + GPS metadata
    validator: Option<Address>, // AI oracle o validador humano
    validated_at: Option<u64>,
}

pub enum ClaimStatus {
    Pending,      // Esperando validación
    Approved,     // Validado, pago procesado
    Rejected,     // No cumple requisitos
    Disputed,     // En revisión manual
}
```

**Funciones principales**:
```rust
// Sponsor functions
fn create_pool(sponsor: Address, token: Address, initial_amount: i128) -> Result<(), Error>
fn fund_pool(amount: i128) -> Result<(), Error>
fn withdraw_pool(amount: i128) -> Result<(), Error>

// Claim processing
fn submit_claim(mission_id: u64, proof_uri: String) -> Result<u64, Error>
fn validate_claim(claim_id: u64, approved: bool) -> Result<(), Error>
fn distribute_reward(claim_id: u64) -> Result<(), Error>

// Queries
fn get_claim(claim_id: u64) -> Claim
fn get_user_claims(user: Address) -> Vec<Claim>
fn get_pool_stats(sponsor: Address) -> RewardPool
```

---

### Contract 3: CertificateNFT
**Propósito**: Emisión de NFTs certificados de impacto ambiental (RWA)

```rust
pub struct ImpactCertificate {
    token_id: u64,
    owner: Address,
    mission_id: u64,
    claim_id: u64,
    location: Location,
    timestamp: u64,
    weight_kg: Option<u32>,    // Estimación de kg recolectados
    category: WasteCategory,   // Plástico, Vidrio, Orgánico, etc.
    proof_uri: String,         // IPFS con evidencia
    carbon_offset: Option<u32>, // CO2 equivalente offseteado
}

pub enum WasteCategory {
    Plastic,
    Glass,
    Paper,
    Metal,
    Organic,
    Electronic,
    Mixed,
}
```

**Funciones principales**:
```rust
// NFT minting
fn mint_certificate(owner: Address, mission_id: u64, claim_id: u64, metadata: CertificateMetadata) -> Result<u64, Error>
fn transfer_certificate(token_id: u64, to: Address) -> Result<(), Error>
fn burn_certificate(token_id: u64) -> Result<(), Error> // Para compensación corporativa

// Queries
fn get_certificate(token_id: u64) -> ImpactCertificate
fn get_user_certificates(user: Address) -> Vec<ImpactCertificate>
fn get_total_impact(user: Address) -> ImpactStats

// B2B Marketplace
fn list_for_sale(token_id: u64, price: i128) -> Result<(), Error>
fn buy_certificate(token_id: u64) -> Result<(), Error>
```

---

### Contract 4: LeaderboardContract (Gamification)
**Propósito**: Sistema de ligas y clasificaciones

```rust
pub struct UserStats {
    address: Address,
    total_missions: u32,
    total_earnings: i128,
    total_kg_collected: u32,
    level: u8,
    experience: u32,
    streak_days: u16,
    last_activity: u64,
}

pub struct League {
    id: u8,
    name: String,           // Bronze, Silver, Gold, Platinum, Diamond
    min_experience: u32,
    max_members: u32,
    current_members: u32,
    reward_multiplier: u8,  // 1.0x, 1.2x, 1.5x, etc.
}
```

**Funciones principales**:
```rust
fn update_stats(user: Address, mission_id: u64, earnings: i128) -> Result<(), Error>
fn get_user_stats(user: Address) -> UserStats
fn get_leaderboard(league_id: u8, limit: u32) -> Vec<UserStats>
fn promote_user(user: Address) -> Result<League, Error>
```

---

## Flujo de Datos End-to-End

### 1. Creación de Misión (Sponsor/Gobierno)

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Dashboard  │─────>│  Backend API │─────>│ MissionContract │
│  (Admin)    │      │              │      │   (Soroban)     │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │                       │
       │ 1. Define misión    │ 2. Valida datos      │ 3. create_mission()
       │    + ubicación GPS  │    + geolocaliza     │    + fund_mission()
       │                     │                       │
       │                     │ 4. Sube metadata     │
       │                     │    a IPFS            │
       │                     v                       │
       │              ┌──────────┐                   │
       │              │   IPFS   │                   │
       │              └──────────┘                   │
       │                     │                       │
       └─────────────────────┴───────────────────────┘
                             │
                             v
                    Mission creada on-chain
                    Estado: Active
                    Fondos: Bloqueados en contrato
```

### 2. Usuario Descubre y Acepta Misión

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Mobile App │─────>│  Backend API │─────>│ MissionContract │
│  (Usuario)  │      │              │      │   (Soroban)     │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │                       │
       │ 1. Abre mapa        │ 2. Query misiones    │ 3. get_active_missions_near()
       │    GPS activo       │    cerca del user    │    (lat, lon, radius)
       │                     │<─────────────────────│
       │<────────────────────│ 4. Lista de misiones │
       │ 5. Selecciona       │                       │
       │    misión           │                       │
       │                     │                       │
       │ 6. Ve detalles      │ 7. Fetch metadata    │
       │    (fotos "antes"   │    desde IPFS        │
       │     descripción)    │                       │
       │                     v                       │
       │              ┌──────────┐                   │
       │              │   IPFS   │                   │
       │              └──────────┘                   │
       │                     │                       │
       │<────────────────────┘                       │
       │                                             │
       │ 8. Acepta misión                            │
       │    (navega al lugar)                        │
       └─────────────────────────────────────────────┘
```

### 3. Validación con IA y Envío de Claim

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  Mobile App │─────>│  AI Service  │─────>│  Backend    │─────>│RewardContract│
│  (Usuario)  │      │  (Python)    │      │    API      │      │  (Soroban)   │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
       │                     │                     │                     │
       │ 1. Toma foto        │                     │                     │
       │    "después"        │                     │                     │
       │    (limpio)         │                     │                     │
       │                     │                     │                     │
       │ 2. Envía imagen ────>                     │                     │
       │    + GPS coords     │ 3. Valida:          │                     │
       │    + timestamp      │    - GPS en radio   │                     │
       │                     │    - Timestamp ok   │                     │
       │                     │    - IA: es basura  │                     │
       │                     │    - IA: clasificar │                     │
       │<─────────────────── │ 4. Resultado        │                     │
       │ 5. Confirmación     │    validación       │                     │
       │                     │                     │                     │
       │ 6. Submit claim ─────────────────────────>│ 7. Sube proof       │
       │                     │                     │    a IPFS           │
       │                     │                     v                     │
       │                     │              ┌──────────┐                 │
       │                     │              │   IPFS   │                 │
       │                     │              └──────────┘                 │
       │                     │                     │                     │
       │                     │                     │ 8. submit_claim() ──>
       │                     │                     │    (mission_id,     │
       │                     │                     │     proof_uri)      │
       │                     │                     │<────────────────────│
       │                     │                     │ 9. claim_id         │
       │<─────────────────────────────────────────│                     │
       │ 10. "Claim enviado,                       │                     │
       │      esperando pago"                      │                     │
       └───────────────────────────────────────────────────────────────────┘
```

### 4. Validación Final y Distribución de Recompensa

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│  AI Oracle / │─────>│RewardContract│─────>│ USDC Token   │─────>│   Usuario   │
│  Validador   │      │  (Soroban)   │      │  Contract    │      │   Wallet    │
└──────────────┘      └──────────────┘      └──────────────┘      └─────────────┘
       │                     │                     │                     │
       │ 1. Proceso batch    │                     │                     │
       │    de claims        │                     │                     │
       │    pendientes       │                     │                     │
       │                     │                     │                     │
       │ 2. validate_claim() │                     │                     │
       │    (claim_id,  ────>│                     │                     │
       │     approved=true)  │ 3. Marca claim      │                     │
       │                     │    como Approved    │                     │
       │                     │                     │                     │
       │                     │ 4. distribute_reward()                    │
       │                     │    (claim_id)       │                     │
       │                     │─────────────────────>│ 5. transfer()       │
       │                     │                     │    (from: pool,     │
       │                     │                     │     to: usuario, ───>
       │                     │                     │     amount: X)      │
       │                     │                     │<────────────────────│
       │                     │<────────────────────│ 6. Success          │
       │                     │ 7. Update pool      │                     │
       │                     │    balance          │                     │
       │                     │                     │                     │
       │                     │ 8. mint_certificate()                     │
       │                     │    (NFT RWA)        │                     │
       │                     v                     │                     │
       │              ┌──────────────┐             │                     │
       │              │ Certificate  │             │                     │
       │              │ NFT Contract │             │                     │
       │              └──────────────┘             │                     │
       │                     │                     │                     │
       │                     │ 9. Mint NFT ─────────────────────────────>
       │                     │    (claim proof +   │                     │
       │                     │     impact data)    │                     │
       └───────────────────────────────────────────────────────────────────┘
                             │
                             v
                   Usuario recibe:
                   - USDC en wallet
                   - NFT certificado
                   - XP/Stats actualizados
```

---

## Componentes del Sistema

### 1. Mobile App (React Native / PWA)

**Pantallas principales**:
- **Home/Map**: Mapa con pins de misiones activas cerca
- **Mission Details**: Fotos antes, descripción, recompensa, distancia
- **Camera/Validation**: Captura foto + validación IA en tiempo real
- **Wallet**: Balance USDC/XLM, historial de claims, NFTs
- **Profile/Stats**: Nivel, XP, ligas, estadísticas personales
- **Leaderboard**: Rankings local/nacional

**Features clave**:
```typescript
// Wallet integration
import { FreighterWallet } from '@stellar/wallet-sdk'

// Camera + AI validation
const validatePhoto = async (imageBlob: Blob, gps: GPS) => {
  const formData = new FormData()
  formData.append('image', imageBlob)
  formData.append('latitude', gps.lat)
  formData.append('longitude', gps.lon)

  const response = await fetch('/api/ai/validate', {
    method: 'POST',
    body: formData
  })

  return response.json() // { valid: boolean, category: string, confidence: number }
}

// Submit claim to contract
const submitClaim = async (missionId: number, proofUri: string) => {
  const contract = new RewardContract(contractAddress)
  const result = await contract.submit_claim({
    mission_id: missionId,
    proof_uri: proofUri
  })
  return result.claim_id
}
```

### 2. AI Validation Service (Python)

**Modelo de validación**:
```python
# waste_classifier.py
import tensorflow as tf
from PIL import Image
import numpy as np

class WasteClassifier:
    def __init__(self, model_path: str):
        self.model = tf.keras.models.load_model(model_path)
        self.categories = ['plastic', 'glass', 'paper', 'metal', 'organic', 'mixed']

    def validate_image(self, image: Image, gps: tuple, mission_location: tuple, radius: int) -> dict:
        # 1. Validar geolocalización
        if not self.is_within_radius(gps, mission_location, radius):
            return {'valid': False, 'reason': 'Fuera del área de misión'}

        # 2. Preprocesar imagen
        img_array = self.preprocess(image)

        # 3. Predicción
        predictions = self.model.predict(img_array)
        category_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][category_idx])

        # 4. Validar confianza mínima
        if confidence < 0.7:
            return {'valid': False, 'reason': 'Baja confianza en clasificación'}

        return {
            'valid': True,
            'category': self.categories[category_idx],
            'confidence': confidence,
            'estimated_weight_kg': self.estimate_weight(image, category_idx)
        }

    def is_within_radius(self, gps1: tuple, gps2: tuple, radius_m: int) -> bool:
        from geopy.distance import geodesic
        distance = geodesic(gps1, gps2).meters
        return distance <= radius_m
```

**API Endpoint**:
```python
# api.py
from fastapi import FastAPI, File, UploadFile, Form
from waste_classifier import WasteClassifier
import ipfshttpclient

app = FastAPI()
classifier = WasteClassifier('models/waste_v1.h5')
ipfs_client = ipfshttpclient.connect()

@app.post("/api/ai/validate")
async def validate_proof(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    mission_id: int = Form(...)
):
    # 1. Obtener datos de misión
    mission = get_mission_from_contract(mission_id)

    # 2. Validar imagen
    img = Image.open(image.file)
    result = classifier.validate_image(
        img,
        gps=(latitude, longitude),
        mission_location=(mission.latitude, mission.longitude),
        radius=mission.radius
    )

    if not result['valid']:
        return result

    # 3. Subir a IPFS
    ipfs_hash = ipfs_client.add_json({
        'mission_id': mission_id,
        'gps': {'lat': latitude, 'lon': longitude},
        'timestamp': int(time.time()),
        'category': result['category'],
        'confidence': result['confidence'],
        'image_hash': ipfs_client.add(image.file)
    })

    return {
        **result,
        'proof_uri': f'ipfs://{ipfs_hash}'
    }
```

### 3. Backend API (Node.js/Express)

**Endpoints principales**:
```typescript
// missions.ts
app.get('/api/missions/nearby', async (req, res) => {
  const { lat, lon, radius } = req.query
  const missions = await missionContract.get_active_missions_near(lat, lon, radius)
  res.json(missions)
})

app.post('/api/missions/create', requireAuth, async (req, res) => {
  const { location, reward, max_claimers, metadata } = req.body

  // 1. Subir metadata a IPFS
  const metadataUri = await uploadToIPFS(metadata)

  // 2. Crear misión on-chain
  const missionId = await missionContract.create_mission({
    creator: req.user.address,
    location,
    reward_amount: reward,
    max_claimers,
    metadata_uri: metadataUri
  })

  res.json({ mission_id: missionId })
})

// claims.ts
app.get('/api/claims/user/:address', async (req, res) => {
  const claims = await rewardContract.get_user_claims(req.params.address)
  res.json(claims)
})

// leaderboard.ts
app.get('/api/leaderboard/:league', async (req, res) => {
  const leaderboard = await leaderboardContract.get_leaderboard(
    req.params.league,
    limit = 100
  )
  res.json(leaderboard)
})
```

### 4. Admin Dashboard (React)

**Features**:
- Crear/editar/cancelar misiones
- Financiar pools de recompensas
- Ver estadísticas agregadas
- Mapas de calor de impacto
- Exportar reportes
- Aprobar/rechazar claims disputados

---

## Seguridad y Escalabilidad

### Medidas de Seguridad

1. **Anti-fraude**:
   - Validación GPS con timestamp on-chain
   - Detección de imágenes duplicadas (hashing)
   - Límite de claims por usuario/día
   - Análisis de patrones sospechosos

2. **Smart Contract Security**:
   - Auditorías de código
   - Rate limiting on-chain
   - Reentrancy guards
   - Access control (roles)

3. **Privacy**:
   - GPS con precisión reducida público (100m radius)
   - Opción de anonimizar wallet en leaderboard
   - Imágenes sin rostros/información personal

### Escalabilidad

1. **Batch Processing**:
   - Validación de claims en lotes (reduce gas)
   - Actualización de leaderboard cada X bloques

2. **Caching**:
   - Redis para queries frecuentes
   - CDN para assets estáticos
   - IPFS gateway con cache

3. **Indexación**:
   - Soroban RPC events → PostgreSQL
   - GraphQL API para queries complejas

---

## Próximos Pasos de Implementación

1. Configurar entorno de desarrollo Soroban
2. Implementar MissionContract (MVP)
3. Implementar RewardContract (MVP)
4. Integrar wallet Freighter en frontend
5. Prototipar validación IA básica
6. Conectar frontend con contratos en testnet
7. Demo end-to-end funcional para hackathon
