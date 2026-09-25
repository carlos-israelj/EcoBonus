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

## Features Pendientes (de la documentación compartida) ❌

### 1. Misiones con GPS Validation
- **Status:** ❌ NO implementado
- **Requiere:**
  - Endpoint: `GET /api/missions/nearby?lat=X&lon=Y&radius=5000`
  - PostGIS extension (YA está en schema SQL ✅)
  - Trigger de distancia GPS (YA está en schema SQL ✅)
  - Frontend que capture coordenadas del usuario

**Código necesario:**
```javascript
// src/controllers/mission.controller.js
export async function getNearbyMissions(req, res) {
  const { lat, lon, radius = 5000 } = req.query;

  const { data, error } = await supabase.rpc('missions_nearby', {
    user_lat: parseFloat(lat),
    user_lon: parseFloat(lon),
    radius_meters: parseInt(radius)
  });

  res.json({ success: true, missions: data });
}
```

**SQL function (FALTA en schema):**
```sql
CREATE OR REPLACE FUNCTION missions_nearby(
  user_lat FLOAT,
  user_lon FLOAT,
  radius_meters INT DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  points_reward INTEGER,
  distance_meters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.description,
    m.points_reward,
    ST_Distance(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(m.longitude, m.latitude)::geography
    )::INTEGER as distance_meters
  FROM missions m
  WHERE m.status = 'active'
    AND ST_DWithin(
      ST_MakePoint(m.longitude, m.latitude)::geography,
      ST_MakePoint(user_lon, user_lat)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
```

### 2. Before/After Photos con Coordenadas
- **Status:** ❌ Parcialmente implementado
- **Lo que falta:**
  - Validar que fotos tengan coordenadas GPS embedded
  - Comparar coordenadas de before/after con ubicación de misión
  - Validar timestamp (before debe ser antes que after)

**Código necesario:**
```javascript
// src/services/claim.service.js
import ExifParser from 'exif-parser';

async function validatePhotoGPS(photoBuffer, expectedLat, expectedLon, maxDistance = 100) {
  const parser = ExifParser.create(photoBuffer);
  const result = parser.parse();

  const photoLat = result.tags.GPSLatitude;
  const photoLon = result.tags.GPSLongitude;

  const distance = calculateDistance(photoLat, photoLon, expectedLat, expectedLon);

  if (distance > maxDistance) {
    throw new Error(`Photo taken ${distance}m away from mission location`);
  }

  return { lat: photoLat, lon: photoLon, timestamp: result.tags.DateTimeOriginal };
}
```

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

### Alta Prioridad (Core Features)
1. ✅ Autenticación dual (Privy + Stellar)
2. ✅ Sistema de puntos
3. ✅ Vouchers QR
4. ❌ **GPS-based mission discovery** → IMPLEMENTAR PRÓXIMO
5. ❌ **Before/After photo validation** → IMPLEMENTAR PRÓXIMO

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

### Sprint Actual: GPS Missions + Photo Validation

1. **Agregar función SQL para misiones cercanas**
   - Editar: `supabase-schema.sql`
   - Agregar: `CREATE FUNCTION missions_nearby(...)`

2. **Implementar endpoint de misiones cercanas**
   - Editar: `src/controllers/mission.controller.js`
   - Agregar: `getNearbyMissions(req, res)`

3. **Validar fotos con EXIF GPS**
   - Instalar: `npm install exif-parser`
   - Crear: `src/utils/photoValidator.js`
   - Integrar en: `src/controllers/claim.controller.js`

4. **Testing**
   - Crear misión de prueba en Supabase
   - Simular claim con fotos GPS
   - Verificar distancia y timestamps

¿Procedo con la implementación de GPS missions + photo validation?
