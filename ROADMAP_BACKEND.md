# EcoBonus - Roadmap Backend

**Owner**: Backend Team
**Stack**: Node.js + Express + Supabase + Privy + Stellar
**Última Actualización**: 2026-09-24

---

## 🎯 Responsabilidades del Backend

1. **Autenticación** - Privy integration (social login + embedded wallets)
2. **Base de Datos** - Supabase (PostgreSQL + Storage + Realtime)
3. **Lógica de Negocio** - Points system, validation queue, voucher redemption
4. **Blockchain** - Stellar SDK + Trustless Work integration
5. **AI Integration** - DETR model para validación de fotos
6. **APIs RESTful** - Endpoints para frontend consumption

---

## 📦 Tech Stack

### Core
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Language**: JavaScript (migrar a TypeScript en v2)
- **Database**: Supabase (PostgreSQL 15)
- **Storage**: Supabase Storage
- **Auth**: Privy

### Blockchain
- **Network**: Stellar (testnet → mainnet)
- **SDK**: `@stellar/stellar-sdk`
- **Escrow**: Trustless Work REST API

### AI/ML
- **Model**: DETR (Facebook) para object detection
- **Runtime**: Python Flask service (separate)
- **Integration**: HTTP REST

### DevOps
- **Hosting**: Railway / Render / Vercel Functions
- **Logs**: Winston
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

---

## 🗄️ Supabase Schema (10 Tablas)

### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('user', 'validator', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### 2. `user_points`
```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  zones_cleaned INTEGER DEFAULT 0,
  total_bags_collected INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `points_transactions`
```sql
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id),
  points_earned INTEGER DEFAULT 0,
  points_spent INTEGER DEFAULT 0,
  transaction_type TEXT CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'penalty')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_created (user_id, created_at DESC)
);
```

### 4. `missions`
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_code TEXT UNIQUE NOT NULL, -- LM-RIM-0412
  zone_name TEXT NOT NULL,
  zone_type TEXT CHECK (zone_type IN ('focos', 'rios', 'playas', 'parques')),
  severity TEXT CHECK (severity IN ('alto', 'medio', 'limpio')) DEFAULT 'alto',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 50,
  reference_photo_url TEXT,
  reward_points INTEGER DEFAULT 40,
  sponsor_id UUID REFERENCES sponsors(id),
  status TEXT CHECK (status IN ('active', 'completed', 'expired')) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  INDEX idx_location (latitude, longitude),
  INDEX idx_status (status, zone_type)
);
```

### 5. `claims`
```sql
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  before_photo_url TEXT NOT NULL,
  after_photo_url TEXT NOT NULL,
  before_photo_hash TEXT, -- SHA-256
  after_photo_hash TEXT,
  perceptual_hash TEXT, -- pHash anti-duplicate
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  bags_collected INTEGER DEFAULT 0,
  ai_validation_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_validation_result JSONB,
  status TEXT CHECK (status IN ('pending', 'ai_approved', 'admin_approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  validator_id UUID REFERENCES users(id),
  escrow_id TEXT, -- Trustless Work contract
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_status_created (status, created_at DESC)
);
```

### 6. `sponsors`
```sql
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  wallet_address TEXT UNIQUE,
  contact_email TEXT,
  total_funded_xlm DECIMAL(18, 7) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. `sponsor_products`
```sql
CREATE TABLE sponsor_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_image_url TEXT,
  points_cost INTEGER NOT NULL,
  stock_available INTEGER DEFAULT 0,
  category TEXT CHECK (category IN ('alimentos', 'higiene', 'educacion', 'otros')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_active_category (active, category)
);
```

### 8. `voucher_redemptions`
```sql
CREATE TABLE voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES sponsor_products(id),
  points_spent INTEGER NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  qr_hash TEXT, -- SHA-256
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP,
  redeemed_location TEXT,
  on_chain_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_redeemed (user_id, redeemed)
);
```

### 9. `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT CHECK (achievement_type IN ('level_up', 'streak', 'zones', 'bags', 'missions')),
  achievement_name TEXT,
  achievement_description TEXT,
  nft_token_id TEXT UNIQUE,
  nft_tx_hash TEXT,
  earned_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_type (user_id, achievement_type)
);
```

### 10. `leaderboard_cache`
```sql
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  category TEXT CHECK (category IN ('points', 'zones', 'bags', 'streak')),
  user_id UUID REFERENCES users(id),
  rank INTEGER,
  score INTEGER,
  university TEXT,
  district TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(period, category, user_id),
  INDEX idx_period_category_rank (period, category, rank)
);
```

---

## 🚀 API Endpoints

### Authentication (Privy)
```
POST   /api/auth/privy-verify          # Verify Privy JWT
GET    /api/auth/profile                # Current user
POST   /api/auth/link-wallet            # Link Stellar wallet
POST   /api/auth/logout                 # Clear session
```

### Points System
```
GET    /api/points/balance/:userId      # User points balance
POST   /api/points/earn                 # Award points (internal)
POST   /api/points/spend                # Deduct points
GET    /api/points/transactions/:userId # Points history
GET    /api/points/leaderboard          # Rankings
```

### Missions
```
GET    /api/missions                    # List active missions
GET    /api/missions/:id                # Mission details
POST   /api/missions                    # Create mission (admin/validator)
PATCH  /api/missions/:id                # Update mission
GET    /api/missions/nearby?lat=&lng=&radius= # Geo-search
DELETE /api/missions/:id                # Delete mission (admin)
```

### Claims & Validation
```
POST   /api/claims                      # Submit claim (2 photos)
GET    /api/claims/pending              # Validator queue
GET    /api/claims/:id                  # Claim details
POST   /api/claims/:id/approve          # Manual approval
POST   /api/claims/:id/reject           # Reject with reason
POST   /api/claims/:id/ai-validate      # Trigger AI
GET    /api/claims/user/:userId         # User's claims
```

### Vouchers
```
GET    /api/vouchers/catalog            # Available products
POST   /api/vouchers/redeem             # Redeem points
GET    /api/vouchers/:userId            # User's vouchers
POST   /api/vouchers/:id/use            # Mark as used (partner)
```

### Sponsors (Admin)
```
GET    /api/sponsors                    # List sponsors
POST   /api/sponsors                    # Create sponsor
GET    /api/sponsors/:id/products       # Sponsor products
POST   /api/sponsors/:id/products       # Add product
PATCH  /api/sponsors/:id/products/:pid  # Update product stock
DELETE /api/sponsors/:id/products/:pid  # Remove product
```

### Achievements
```
GET    /api/achievements/:userId        # User badges
POST   /api/achievements/mint           # Mint NFT (internal)
```

### Analytics (Admin)
```
GET    /api/analytics/overview          # Dashboard stats
GET    /api/analytics/missions          # Mission metrics
GET    /api/analytics/users             # User growth
GET    /api/analytics/impact            # Tons removed, bags collected
```

---

## 📅 Implementación por Sprints

### Sprint 0: Setup (Sep 24-30) 🔥 CURRENT

**Supabase Setup**:
- [ ] Crear proyecto en Supabase
- [ ] Run SQL schema (10 tablas)
- [ ] Setup Storage buckets:
  - `evidence-photos` (public)
  - `mission-refs` (public)
  - `sponsor-logos` (public)
- [ ] Configure RLS policies
- [ ] Get API keys

**Privy Integration**:
- [ ] Install `@privy-io/server-auth`
- [ ] Create middleware `authenticatePrivy()`
- [ ] Endpoint `/api/auth/privy-verify`
- [ ] User sync service (Privy → Supabase)
- [ ] Update `.env`:
  ```
  PRIVY_APP_ID=cmug2qj1b01t90bjj0erfq3py
  PRIVY_APP_SECRET=privy_app_secret_4xiVbRW2227viiWNPfv24B7R5JSBAcZZ68C6P5AVna24Ki48fcDQXmtP5dbrnD92aMsqWfxtkm9hsZDYt1PHkuRH
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJxxx
  ```

**Points System**:
- [ ] Service: `src/services/points.service.js`
  - `awardPoints(userId, missionId, amount, reason)`
  - `spendPoints(userId, amount, reason)`
  - `getBalance(userId)`
  - `getTransactions(userId, limit, offset)`
  - `calculateLevel(xp)` - Formula: `floor(sqrt(xp/100)) + 1`
- [ ] Controller: `src/controllers/points.controller.js`
- [ ] Routes: `/api/points/*`

**Deliverables**:
- Supabase configurado y accesible
- Privy auth funcionando
- Points API operativa

---

### Sprint 1: Missions & Map (Oct 1-7)

**Geo-Search**:
- [ ] Service: `src/services/missions.service.js`
  - `getNearbyMissions(lat, lng, radiusKm)`
  - `generateMissionCode(zoneType, sequence)` → LM-RIM-0412
  - `createMission(data)`
  - `updateMissionSeverity(id, severity)`

**API Endpoints**:
- [ ] `GET /api/missions/nearby?lat=-12.118893&lng=-77.029572&radius=5`
- [ ] `GET /api/missions/:id`
- [ ] `POST /api/missions` (admin/validator)

**Deliverables**:
- Missions API completa
- Geo-search funcionando

---

### Sprint 2: Claims (2 Photos) (Oct 8-14)

**Photo Upload**:
- [ ] Service: `src/services/storage.service.js`
  - `uploadPhoto(file, userId, type)` → Supabase Storage
  - `generateSHA256(file)`
  - `generatePerceptualHash(file)` - usando `imagehash` library

**Claims Submission**:
- [ ] Service: `src/services/claims.service.js`
  - `submitClaim(userId, missionId, beforePhoto, afterPhoto, gps, bags)`
  - `validateGPSProximity(claimGPS, missionGPS, maxDistanceMeters)`
  - `checkDuplicatePhoto(perceptualHash)`

**API Endpoints**:
- [ ] `POST /api/claims` (multipart/form-data)
  - Body: `{ missionId, beforePhoto (file), afterPhoto (file), gps: {lat, lng}, bagsCollected }`

**Deliverables**:
- Upload de 2 fotos funcionando
- GPS validation activa
- Duplicate detection

---

### Sprint 3: AI Validation (Oct 15-21)

**AI Service Integration**:
- [ ] Update `src/services/ai.service.js`
  - `validatePhotos(beforeUrl, afterUrl)`
  - Returns: `{ valid: boolean, confidence: number, details: {} }`

**Claim Processing**:
- [ ] Auto-trigger AI al submit claim
- [ ] Update claim status:
  - `ai_validation_score >= 0.75` → `ai_approved`
  - `< 0.75` → `rejected`
- [ ] Store AI result in `ai_validation_result` JSONB

**Deliverables**:
- AI validation automática
- Claims clasificados por AI

---

### Sprint 4: Validator Dashboard (Oct 22-28)

**Admin Queue**:
- [ ] Service: `src/services/validation.service.js`
  - `getPendingClaims(validatorId)`
  - `approveClaim(claimId, validatorId)`
  - `rejectClaim(claimId, validatorId, reason)`

**Trustless Work Integration**:
- [ ] Update `src/services/trustlessWork.service.js`
  - `approveMilestone()` se llama en `approveClaim()`
  - `releaseFunds()` se llama después de approve

**Points Award**:
- [ ] En `approveClaim()`:
  - Call `awardPoints(user_id, mission_id, reward_points)`
  - Update mission severity → `limpio`
  - Mint achievement NFT si alcanza hito

**API Endpoints**:
- [ ] `GET /api/claims/pending`
- [ ] `POST /api/claims/:id/approve`
- [ ] `POST /api/claims/:id/reject`

**Deliverables**:
- Validator queue funcionando
- Manual approval → points awarded
- Trustless Work integration completa

---

### Sprint 5: Vouchers (Oct 29 - Nov 4)

**Sponsor Products**:
- [ ] Service: `src/services/sponsors.service.js`
  - `getProducts(filters)`
  - `createProduct(sponsorId, productData)`
  - `updateStock(productId, delta)`

**Redemption**:
- [ ] Service: `src/services/vouchers.service.js`
  - `redeemVoucher(userId, productId)`
  - `generateQRCode()` - usando `qrcode` library
  - `hashQR(qrCode)` - SHA-256
  - `recordOnChain(redemptionId, qrHash)`

**API Endpoints**:
- [ ] `GET /api/vouchers/catalog`
- [ ] `POST /api/vouchers/redeem`
- [ ] `GET /api/vouchers/:userId`
- [ ] `POST /api/vouchers/:id/use` (partner endpoint)

**Smart Contract Call**:
- [ ] `VoucherRedeemContract.redeem(voucher_id, qr_hash)`
- [ ] Store `on_chain_tx_hash` in redemptions table

**Deliverables**:
- Voucher redemption completo
- QR generation
- On-chain proof

---

### Sprint 6: Gaming (Nov 5-11)

**Levels & XP**:
- [ ] Update `awardPoints()`:
  - Calculate new XP
  - Check if level-up: `newLevel = calculateLevel(newXP)`
  - If level-up: `mintAchievementNFT(userId, 'level_up', newLevel)`

**Streaks**:
- [ ] Service: `src/services/streaks.service.js`
  - `updateStreak(userId)`
  - Called on every claim approval
  - Logic:
    - If last_activity_date == yesterday → streak++
    - If last_activity_date == today → no change
    - Else → streak = 1 (reset)
  - Bonus: `if (streak >= 5) awardPoints(userId, null, 10, 'Streak bonus')`

**Deliverables**:
- Levels auto-calculating
- Streaks tracking
- Bonus points por rachas

---

### Sprint 7: Leaderboard (Nov 12-18)

**Leaderboard Calculation**:
- [ ] Service: `src/services/leaderboard.service.js`
  - `updateLeaderboards()` - cron job cada hora
  - Calculate rankings:
    - Points: `user_points.total_points DESC`
    - Zones: `user_points.zones_cleaned DESC`
    - Bags: `user_points.total_bags_collected DESC`
    - Streak: `user_points.streak_days DESC`
  - Periods: daily, weekly, monthly, all_time
  - Segmentos: universidad, distrito

**Cron Job**:
- [ ] Install `node-cron`
- [ ] Schedule: `cron.schedule('0 * * * *', updateLeaderboards)` (every hour)

**API Endpoints**:
- [ ] `GET /api/points/leaderboard?period=weekly&category=points&university=PUCP`

**Deliverables**:
- Leaderboards actualizándose automáticamente
- API de rankings funcionando

---

### Sprint 8: Anti-Fraud (Nov 19-25)

**Perceptual Hashing**:
- [ ] Install `sharp` + custom pHash implementation
- [ ] In `submitClaim()`:
  - Generate pHash for after_photo
  - Query: `SELECT * FROM claims WHERE perceptual_hash = :hash`
  - If match found → reject with reason "Duplicate photo detected"

**Rate Limiting**:
- [ ] Middleware: `src/middleware/rateLimit.js`
- [ ] Check daily claims count:
  ```sql
  SELECT COUNT(*) FROM claims
  WHERE user_id = :userId
  AND created_at > NOW() - INTERVAL '24 hours'
  ```
- [ ] If count >= 10 → reject

**Validator Reputation**:
- [ ] Track approval rate:
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE status = 'admin_approved') / COUNT(*) AS approval_rate
  FROM claims
  WHERE validator_id = :validatorId
  ```
- [ ] Penalize if approval_rate < 0.3 (too strict) or > 0.95 (too lenient)

**Deliverables**:
- Duplicate photo detection
- Rate limiting activo
- Validator scoring

---

### Sprint 9: Production Prep (Nov 26 - Dec 2)

**Mainnet Deploy**:
- [ ] Deploy smart contracts a Stellar Mainnet
- [ ] Update `.env`:
  ```
  STELLAR_NETWORK=mainnet
  STELLAR_HORIZON_URL=https://horizon.stellar.org
  ```
- [ ] Trustless Work: switch to production API

**KYC Light**:
- [ ] Phone verification (Twilio integration)
- [ ] Required for withdrawals >$100

**Partner Integration**:
- [ ] Tottus/Metro API for voucher validation
- [ ] Webhook para notificar canjes

**Deliverables**:
- Backend en mainnet
- KYC básico
- Partner integrations

---

## 🔧 Development Setup

### Prerequisites
```bash
node -v  # 20.x
npm -v   # 10.x
```

### Install Dependencies
```bash
cd backend
npm install
```

### New Dependencies Needed
```bash
npm install @supabase/supabase-js
npm install @privy-io/server-auth
npm install sharp                # Image processing
npm install qrcode                # QR generation
npm install node-cron             # Scheduled tasks
npm install imagehash             # Perceptual hashing (if available)
```

### Environment Variables
```bash
# .env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
SUPABASE_ANON_KEY=eyJxxx

# Privy
PRIVY_APP_ID=cmug2qj1b01t90bjj0erfq3py
PRIVY_APP_SECRET=privy_app_secret_4xiVbRW2227viiWNPfv24B7R5JSBAcZZ68C6P5AVna24Ki48fcDQXmtP5dbrnD92aMsqWfxtkm9hsZDYt1PHkuRH

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015

# Trustless Work
TRUSTLESS_WORK_API_KEY=CqNH7unN0mIVhvzNBR4DAw.98b875b1e696d784efdc826ba482c4310503189ecbca70f1cf6d61fe3e8542bb
TRUSTLESS_WORK_API_URL=https://dev.api.trustlesswork.com

# Admin Wallet
ADMIN_PUBLIC_KEY=GDEODUGRGDLD6HSIINDJ52YXBORIST5PYGEPC33CPFVVAA6G5WK6MAHN
ADMIN_SECRET_KEY=SBW7UX5G3SMGFR6UGTK5OHCCNUMV6SEJK2H7MJJDGDWCJALREJUB5IV7

# AI Service
AI_SERVICE_URL=http://localhost:5000
```

### Run Development
```bash
npm run dev
```

---

## ✅ Definition of Done

Cada sprint se considera completo cuando:

1. ✅ Código escrito y funcionando
2. ✅ Unit tests (coverage >70%)
3. ✅ API documentation (Postman collection)
4. ✅ Deployed to staging
5. ✅ Frontend team notified de nuevos endpoints

---

## 🚨 Bloqueadores

### Sprint 0 Bloqueadores:
- ⚠️ Necesitamos crear proyecto Supabase
- ⚠️ Necesitamos confirmar Privy credentials funcionan

### General Risks:
- 🔴 AI service performance (latency)
- 🟡 Trustless Work API reliability
- 🟡 Supabase free tier limits (500 MB DB)

---

## 📞 Contacto

**Backend Lead**: [Tu Nombre]
**Questions**: Slack #backend-dev

---

**Última Actualización**: 2026-09-24
**Próxima Sync**: 2026-10-01
