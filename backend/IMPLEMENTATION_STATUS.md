# Estado de Implementación del Backend EcoBonus

## Arquitectura Confirmada

### Sistema Híbrido (IMPLEMENTADO ✅)
```
Usuario ingresa con Google/Email (Privy)
    ↓
Backend crea registro en Supabase
    ↓
Puntos se guardan en tabla points_ledger
    ↓
Usuario canjea vouchers QR
    ↓
(OPCIONAL) Si quiere certificado NFT → conecta wallet Stellar
```

**Decisión:** NO usar Magic.link, usar Privy + Supabase + Wallet opcional

---

## Features Implementadas ✅

### 1. Autenticación Dual
- **Archivo:** `src/middleware/dualAuth.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Login con Privy (Google, Email)
  - Login con Stellar wallet signature (opcional)
  - Auto-creación de usuarios en Supabase
  - JWT verification

### 2. Sistema de Puntos
- **Archivos:**
  - `src/services/points.service.js`
  - `src/controllers/points.controller.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Obtener balance: `GET /api/points/balance`
  - Ver historial: `GET /api/points/history`
  - Otorgar puntos (al aprobar misión)
  - Gastar puntos (al canjear voucher)
  - Sistema de niveles: `level = sqrt(experience/100) + 1`
  - Bonos por racha (streak)
  - Ledger completo de transacciones

### 3. Sistema de Vouchers QR
- **Archivos:**
  - `src/services/voucher.service.js`
  - `src/controllers/voucher.controller.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Catálogo público: `GET /api/vouchers/catalog`
  - Canjear voucher: `POST /api/vouchers/redeem`
  - Generar QR único (UUID)
  - Ver mis vouchers: `GET /api/vouchers/my-vouchers`
  - Verificar QR (para tiendas): `GET /api/vouchers/verify/:qrCode`
  - Redimir QR (tienda): `POST /api/vouchers/redeem-qr`
  - Control de stock automático
  - Expiración de vouchers

### 4. Dashboard de Validadores
- **Archivos:**
  - `src/controllers/validator.controller.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Ver cola de validación: `GET /api/validator/queue`
  - Asignar claim a validador: `POST /api/validator/assign/:claimId`
  - Aprobar claim: `POST /api/validator/approve/:claimId`
  - Rechazar claim: `POST /api/validator/reject/:claimId`
  - Estadísticas del validador: `GET /api/validator/stats`

### 5. Leaderboard
- **Archivos:**
  - `src/services/leaderboard.service.js`
  - `src/controllers/leaderboard.controller.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Ver leaderboard global: `GET /api/leaderboard`
  - Ver mi posición: `GET /api/leaderboard/my-rank`
  - Ver usuarios cercanos: `GET /api/leaderboard/surrounding`
  - Caché de 5 minutos
  - Top 100 usuarios por puntos

### 6. Base de Datos Supabase
- **Archivo:** `supabase-schema.sql`
- **Status:** ✅ Desplegado
- **Tablas:**
  1. `users` - Usuarios con Privy/Stellar
  2. `missions` - Misiones geográficas
  3. `claims` - Claims de misiones completadas
  4. `points_ledger` - Ledger de puntos
  5. `sponsor_products` - Catálogo de productos
  6. `voucher_redemptions` - Vouchers canjeados
  7. `nft_certificates` - Certificados NFT
  8. `leaderboard_cache` - Caché del leaderboard
  9. `validation_queue` - Cola de validación
  10. `audit_logs` - Logs de auditoría

### 7. Integración Trustless Work
- **Archivos:**
  - `src/services/trustlessWork.service.js`
  - `src/controllers/trustlessWork.controller.js`
- **Status:** ✅ Completado
- **Funcionalidad:**
  - Validar claim: `POST /api/trustless-work/validate-claim`
  - Ver escrow: `GET /api/trustless-work/escrow/:escrowId`
  - Aprobar milestone: `POST /api/trustless-work/approve-milestone`
  - Liberar fondos: `POST /api/trustless-work/release-funds`

---

## Features Completadas Recientemente ✅

### 1. Misiones con GPS Validation ✅ COMPLETADO (Sprint 1)
- **Status:** ✅ COMPLETADO
- **Implementado:**
  - Endpoint: `GET /api/missions/nearby?lat=X&lon=Y&radius=5000` ✅
  - PostGIS extension habilitada ✅
  - SQL function `missions_nearby()` desplegada ✅
  - Testing completo (459m precision) ✅

**Archivos implementados:**
- `backend/create-function-only.sql` - SQL function con PostGIS
- `backend/src/controllers/mission.controller.js` - endpoint getNearbyMissions()
- `backend/test-complete-gps-flow.js` - testing suite completo
- `backend/execute-sql-function.js` - verification script

**Test results:**
```
✅ TEST 1: Function exists and working (459m distance)
✅ TEST 2: Mission creation (LM-MFLOR-0001)
✅ TEST 3: Supabase RPC with multiple radius tests
  ✅ User cerca (461m) → Found 1 mission (459m)
  ✅ User muy cerca (100m radius) → Found 0 missions
  ✅ User en ubicación exacta → Found 1 mission (0m)
  ✅ User lejos (5km) → Found 0 missions
```

### 2. Before/After Photos con Coordenadas ✅ COMPLETADO (Sprint 2)
- **Status:** ✅ COMPLETADO
- **Implementado:**
  - EXIF GPS extraction (latitud, longitud, timestamp)
  - Comparación de coordenadas con ubicación de misión (Haversine formula)
  - Validación de timestamp (before < after)
  - Perceptual hashing para detectar duplicados
  - Sistema de scoring (0-100 puntos)
  - 3 nuevos endpoints

**Archivos implementados:**
- `backend/src/services/photoValidation.service.js` - servicio completo
- `backend/src/controllers/claim.controller.js` - 3 nuevos métodos
- `backend/src/middleware/upload.js` - Multer configuration
- `backend/src/routes/index.js` - 3 nuevas rutas

**Características:**
- GPS extraction con aplicación de hemisferio (N/S, E/W)
- Distance calculation con fórmula Haversine (precision métrica)
- Perceptual hashing con imghash (16-bit hash)
- Hamming distance para comparación (>90% = similar, >98% = identical)
- Scoring: location valid (80pts) + photos different (20pts) + GPS present (20pts bonus)
- Automatic IPFS upload integration ready

### 3. IPFS Metadata para RWA Certificates
- **Status:** ❌ NO implementado
- **Requiere:**
  - Conexión a IPFS (Infura/Pinata)
  - Metadata JSON con formato estándar
  - Minteo de NFT con URI a IPFS

**Formato metadata IPFS (según docs):**
```json
{
  "name": "EcoBonus Impact Certificate #123",
  "description": "Certificate of environmental impact for cleaning mission",
  "image": "ipfs://QmXxx.../certificate-image.png",
  "attributes": [
    {
      "trait_type": "Mission Type",
      "value": "Beach Cleanup"
    },
    {
      "trait_type": "CO2 Reduced",
      "value": "50",
      "units": "kg"
    },
    {
      "trait_type": "Waste Collected",
      "value": "25",
      "units": "kg"
    },
    {
      "trait_type": "Location",
      "value": "Playa del Carmen, Mexico"
    },
    {
      "trait_type": "Date",
      "value": "2025-01-15",
      "display_type": "date"
    },
    {
      "trait_type": "Validator",
      "value": "0xValidatorAddress"
    }
  ],
  "properties": {
    "mission_id": "uuid-123",
    "claim_id": "uuid-456",
    "before_photo": "ipfs://QmBefore.../",
    "after_photo": "ipfs://QmAfter.../",
    "gps_coordinates": {
      "latitude": 20.6274,
      "longitude": -87.0729
    },
    "verified_by": "human_validator",
    "impact_verified": true
  }
}
```

**Código necesario:**
```javascript
// src/services/ipfs.service.js
import { create } from 'ipfs-http-client';

const ipfs = create({
  host: process.env.IPFS_HOST,
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
    ).toString('base64')}`
  }
});

export async function uploadMetadata(claim, mission, photos) {
  const metadata = {
    name: `EcoBonus Impact Certificate #${claim.id}`,
    description: `Certificate for ${mission.title}`,
    image: photos.afterIPFS,
    attributes: [
      { trait_type: 'Mission Type', value: mission.mission_type },
      { trait_type: 'CO2 Reduced', value: mission.co2_impact_kg, units: 'kg' },
      { trait_type: 'Location', value: mission.location_name },
      { trait_type: 'Date', value: claim.completed_at, display_type: 'date' }
    ],
    properties: {
      mission_id: mission.id,
      claim_id: claim.id,
      before_photo: photos.beforeIPFS,
      after_photo: photos.afterIPFS,
      gps_coordinates: {
        latitude: mission.latitude,
        longitude: mission.longitude
      },
      verified_by: 'human_validator',
      impact_verified: true
    }
  };

  const { cid } = await ipfs.add(JSON.stringify(metadata));
  return `ipfs://${cid}`;
}
```

### 4. Fee-Sponsored Transactions
- **Status:** ❌ NO implementado
- **Requiere:**
  - Backend firma transacciones en nombre del usuario
  - Usuario solo aprueba la operación
  - Admin wallet paga fees

**Código necesario:**
```javascript
// src/services/stellar.service.js
import * as StellarSDK from '@stellar/stellar-sdk';

export async function sponsorTransaction(userPublicKey, operation) {
  const server = new StellarSDK.Horizon.Server(process.env.STELLAR_HORIZON_URL);
  const adminKeys = StellarSDK.Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);

  // Build transaction with admin as fee source
  const adminAccount = await server.loadAccount(adminKeys.publicKey());

  const transaction = new StellarSDK.TransactionBuilder(adminAccount, {
    fee: StellarSDK.BASE_FEE,
    networkPassphrase: process.env.STELLAR_PASSPHRASE
  })
  .addOperation(operation)
  .setTimeout(30)
  .build();

  // Admin signs to pay fee
  transaction.sign(adminKeys);

  // User still needs to sign for their operation
  // Frontend will call back with user signature

  return {
    xdr: transaction.toXDR(),
    requiresUserSignature: true
  };
}
```

### 5. Soul-Bound NFT Minting
- **Status:** ❌ NO implementado
- **Requiere:**
  - Llamar contrato de certificados NFT
  - Metadata IPFS URI
  - Marcar NFT como non-transferable

**Código necesario:**
```javascript
// src/services/nft.service.js
import * as StellarSDK from '@stellar/stellar-sdk';

export async function mintImpactCertificate(userId, stellarAddress, impactData, metadataURI) {
  if (!stellarAddress) {
    throw new Error('User must connect Stellar wallet to receive NFT');
  }

  const server = new StellarSDK.Horizon.Server(process.env.STELLAR_HORIZON_URL);
  const contract = new StellarSDK.Contract(process.env.CERTIFICATE_NFT_CONTRACT_ID);

  const operation = contract.call(
    'mint',
    StellarSDK.nativeToScVal(stellarAddress, { type: 'address' }),
    StellarSDK.nativeToScVal(metadataURI, { type: 'string' }),
    StellarSDK.nativeToScVal(impactData.co2_reduced, { type: 'u32' }),
    StellarSDK.nativeToScVal(true, { type: 'bool' }) // soul_bound = true
  );

  // Sponsor transaction
  const { xdr } = await sponsorTransaction(stellarAddress, operation);

  return { xdr, metadataURI };
}
```

---

## Resumen de Prioridades

### Alta Prioridad (Core Features) - COMPLETADO ✅
1. ✅ Autenticación dual (Privy + Stellar)
2. ✅ Sistema de puntos
3. ✅ Vouchers QR
4. ✅ **GPS-based mission discovery** (Sprint 1)
5. ✅ **Before/After photo validation** (Sprint 2)

### Media Prioridad (Blockchain Features)
6. ❌ IPFS metadata upload
7. ❌ Soul-bound NFT minting
8. ❌ Fee-sponsored transactions

### Baja Prioridad (Optimizaciones)
9. ✅ Leaderboard con caché
10. ✅ Validator dashboard
11. ✅ Trustless Work integration

---

## Next Steps

### ✅ Sprints Completados
- ✅ Sprint 0: Setup (Supabase + Privy + Points + Vouchers + Leaderboard)
- ✅ Sprint 1: GPS Missions (PostGIS + API + Testing)
- ✅ Sprint 2: Photo Validation (EXIF GPS + Perceptual Hash + Endpoints)

### 🚀 Próximos Sprints

**Sprint 3: IPFS + RWA Metadata**
- Setup IPFS client (Infura/Pinata)
- Upload fotos a IPFS
- Generar metadata JSON (RWA format)
- Retornar IPFS URI

**Sprint 4: AI Validation**
- Integración con DETR model
- Auto-trigger AI en submit claim
- Store AI result en claims table

**Sprint 5: Soul-Bound NFTs + Fee-Sponsored Txs**
- Modificar CertificateNFT contract
- Fee sponsorship implementation
- Auto-mint en hitos

### 📊 Estado Actual
- **FASE 0**: 100% completada
- **FASE 1**: Sprint 1-2 completados (Backend), Sprint 3 próximo
- **Backend Core Features**: Todos implementados y testeados
- **Frontend**: Puede iniciar implementación completa - todos los endpoints disponibles
