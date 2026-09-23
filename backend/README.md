# EcoBonus Backend API

Backend API service for the EcoBonus Clean-to-Earn platform built on Stellar blockchain.

## Features

- RESTful API for mission management and claim processing
- Stellar Soroban smart contract integration
- IPFS integration for evidence storage
- PostgreSQL database for caching and analytics
- AI validation service integration (Python)
- User profile and impact tracking

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Blockchain**: Stellar SDK (@stellar/stellar-sdk)
- **Database**: PostgreSQL with pg driver
- **Storage**: IPFS (ipfs-http-client)
- **Logging**: Winston
- **Security**: Helmet, CORS

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required configuration:
- Deploy smart contracts to Testnet and add contract IDs
- Set admin wallet keypair for validation operations
- Configure PostgreSQL database connection
- Add IPFS credentials (Infura or local node)

### 3. Setup Database

```bash
# Create database
createdb ecobonus

# Run schema
psql -d ecobonus -f src/models/schema.sql
```

### 4. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Missions
- `GET /api/missions/nearby?lat={lat}&lon={lon}&radius={meters}` - Get nearby missions
- `GET /api/missions/:id` - Get mission details
- `GET /api/missions/:id/claims` - Get all claims for a mission

### Claims
- `POST /api/claims` - Submit new claim with evidence
- `GET /api/claims/:id` - Get claim details
- `POST /api/claims/:id/validate` - Validate claim (admin/oracle only)

### Users
- `GET /api/users/:address` - Get user profile and statistics
- `PUT /api/users/:address` - Update user profile
- `GET /api/users/:address/claims` - Get user's claims
- `GET /api/users/:address/certificates` - Get user's NFT certificates
- `GET /api/users/:address/impact` - Get user's environmental impact stats

## Request Examples

### Submit Claim

```bash
POST /api/claims
Content-Type: application/json

{
  "missionId": 1,
  "claimerAddress": "GABC...",
  "location": {
    "latitude": -12046374,
    "longitude": -77042793
  },
  "images": [
    { "buffer": "base64_image_data", "filename": "photo1.jpg" },
    { "buffer": "base64_image_data", "filename": "photo2.jpg" }
  ]
}
```

### Get Nearby Missions

```bash
GET /api/missions/nearby?lat=-12.046374&lon=-77.042793&radius=5000
```

## Authentication

Protected endpoints require Stellar signature authentication:

```
Headers:
X-Stellar-Signature: {base64_signature}
X-Stellar-PublicKey: {stellar_public_key}
X-Stellar-Timestamp: {unix_timestamp_ms}
X-Stellar-Nonce: {random_nonce}
```

Message format: `{publicKey}:{timestamp}:{nonce}`

## Database Schema

- **users** - User profiles and reputation
- **missions** - Mission cache for fast queries
- **claims** - Claim submissions and validation status
- **certificates** - NFT certificate metadata
- **listings** - B2B marketplace listings
- **daily_stats** - Analytics aggregations
- **leaderboard** - Materialized view for rankings

## Integration with Smart Contracts

The API integrates with 3 Soroban contracts:

1. **MissionContract** - Mission lifecycle and GPS validation
2. **RewardContract** - Reward pools and distribution
3. **CertificateNFT** - Impact certificates as RWAs

Contract interactions use Stellar SDK with transaction simulation for reads and signed transactions for writes.

## IPFS Integration

Evidence photos are uploaded to IPFS:
- Multiple images per claim
- Metadata JSON with location and timestamps
- Returns `ipfs://` URIs for blockchain storage

## Next Steps

- [ ] Implement AI validation service integration
- [ ] Add WebSocket support for real-time updates
- [ ] Implement rate limiting
- [ ] Add comprehensive test suite
- [ ] Deploy to production with monitoring

## License

MIT
