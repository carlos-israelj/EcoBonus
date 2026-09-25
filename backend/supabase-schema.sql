-- EcoBonus Supabase Database Schema
-- Version: 1.0
-- Created: 2026-09-24
-- Based on: ROADMAP_BACKEND.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- TABLE 1: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_user_id TEXT UNIQUE, -- Privy ID (for social login)
  stellar_address TEXT UNIQUE, -- Stellar wallet address (for direct wallet login)
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  university TEXT,
  district TEXT,
  city TEXT DEFAULT 'Lima',
  country TEXT DEFAULT 'Peru',
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_claim_date DATE,
  total_missions_completed INTEGER DEFAULT 0,
  total_bags_collected INTEGER DEFAULT 0,
  total_weight_kg NUMERIC(10, 2) DEFAULT 0,
  reputation_score NUMERIC(5, 2) DEFAULT 100.0, -- Anti-fraud reputation
  is_validator BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_privy_id ON users(privy_user_id);
CREATE INDEX idx_users_stellar ON users(stellar_address);
CREATE INDEX idx_users_university ON users(university);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_points ON users(total_points DESC);

-- =============================================
-- TABLE 2: missions
-- =============================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- Format: LM-ZONA-NNNN (e.g., LM-RIM-0412)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('focos', 'rios', 'playas', 'parques')),
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS point (lat, lng)
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_meters INTEGER DEFAULT 20, -- GPS verification radius
  address TEXT,
  district TEXT,
  city TEXT DEFAULT 'Lima',
  reward_points INTEGER DEFAULT 40,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_bags INTEGER DEFAULT 3,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  photo_url TEXT, -- Before photo of the area
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'completed', 'expired')),
  max_claims INTEGER DEFAULT 1, -- How many times this mission can be claimed
  current_claims INTEGER DEFAULT 0,
  escrow_contract_id TEXT, -- Trustless Work escrow ID
  escrow_address TEXT, -- Stellar contract address
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for missions table
CREATE INDEX idx_missions_location ON missions USING GIST(location);
CREATE INDEX idx_missions_category ON missions(category);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_city ON missions(city, district);
CREATE INDEX idx_missions_code ON missions(code);

-- =============================================
-- TABLE 3: claims
-- =============================================
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  before_photo_url TEXT NOT NULL, -- IPFS/Supabase Storage URL
  after_photo_url TEXT NOT NULL, -- IPFS/Supabase Storage URL
  before_photo_hash TEXT, -- Perceptual hash (anti-duplicate)
  after_photo_hash TEXT,
  gps_latitude NUMERIC(10, 7) NOT NULL,
  gps_longitude NUMERIC(10, 7) NOT NULL,
  gps_accuracy NUMERIC(5, 2), -- meters
  distance_from_mission NUMERIC(6, 2), -- meters (calculated)
  bags_collected INTEGER NOT NULL,
  estimated_weight_kg NUMERIC(5, 2), -- bags * avg_weight
  ai_validation_score NUMERIC(5, 4), -- 0.0 to 1.0 (AI confidence)
  ai_detected_waste BOOLEAN,
  ai_detected_cleanup BOOLEAN,
  validation_status TEXT DEFAULT 'pending' CHECK (
    validation_status IN ('pending', 'ai_approved', 'approved', 'rejected', 'disputed')
  ),
  validator_id UUID REFERENCES users(id), -- Admin who approved/rejected
  validation_notes TEXT,
  validated_at TIMESTAMPTZ,
  points_awarded INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0, -- Streak/difficulty bonuses
  total_points INTEGER DEFAULT 0,
  escrow_milestone_id TEXT, -- Trustless Work milestone ID
  funds_released BOOLEAN DEFAULT FALSE,
  nft_certificate_id TEXT, -- NFT minted after approval
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for claims table
CREATE INDEX idx_claims_mission ON claims(mission_id);
CREATE INDEX idx_claims_user ON claims(user_id);
CREATE INDEX idx_claims_status ON claims(validation_status);
CREATE INDEX idx_claims_validator ON claims(validator_id);
CREATE INDEX idx_claims_pending ON claims(validation_status, created_at)
  WHERE validation_status = 'pending';

-- =============================================
-- TABLE 4: points_ledger
-- =============================================
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('earn', 'spend', 'bonus', 'penalty', 'refund')
  ),
  amount INTEGER NOT NULL, -- Positive for earn/bonus, negative for spend/penalty
  balance_after INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (
    source IN ('mission_completion', 'streak_bonus', 'level_up', 'voucher_redemption', 'admin_adjustment', 'referral')
  ),
  reference_id UUID, -- claim_id or voucher_redemption_id
  description TEXT,
  metadata JSONB, -- Additional data (e.g., streak_days, level_reached)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for points_ledger table
CREATE INDEX idx_points_user ON points_ledger(user_id, created_at DESC);
CREATE INDEX idx_points_type ON points_ledger(transaction_type);
CREATE INDEX idx_points_source ON points_ledger(source);

-- =============================================
-- TABLE 5: sponsor_products (Vouchers)
-- =============================================
CREATE TABLE IF NOT EXISTS sponsor_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_name TEXT NOT NULL,
  sponsor_logo_url TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_image_url TEXT,
  category TEXT CHECK (category IN ('alimentos', 'utiles', 'ropa', 'servicios', 'otros')),
  points_cost INTEGER NOT NULL,
  stock_available INTEGER DEFAULT 0, -- -1 for unlimited
  stock_reserved INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  terms_and_conditions TEXT,
  expiration_days INTEGER DEFAULT 30, -- Voucher validity after redemption
  redemption_locations TEXT[], -- Array of store addresses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sponsor_products table
CREATE INDEX idx_products_active ON sponsor_products(is_active, points_cost);
CREATE INDEX idx_products_category ON sponsor_products(category);
CREATE INDEX idx_products_sponsor ON sponsor_products(sponsor_name);

-- =============================================
-- TABLE 6: voucher_redemptions
-- =============================================
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES sponsor_products(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL, -- UUID-based QR code
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT, -- Store clerk ID or validator
  redemption_location TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for voucher_redemptions table
CREATE INDEX idx_vouchers_user ON voucher_redemptions(user_id, status);
CREATE INDEX idx_vouchers_qr ON voucher_redemptions(qr_code);
CREATE INDEX idx_vouchers_status ON voucher_redemptions(status);
CREATE INDEX idx_vouchers_expiring ON voucher_redemptions(expires_at)
  WHERE status = 'active';

-- =============================================
-- TABLE 7: nft_certificates
-- =============================================
CREATE TABLE IF NOT EXISTS nft_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  nft_type TEXT NOT NULL CHECK (
    nft_type IN ('mission_completion', 'milestone', 'achievement', 'level_badge')
  ),
  achievement_name TEXT NOT NULL, -- e.g., "Guardián Urbano Nivel 4"
  achievement_description TEXT,
  image_url TEXT, -- IPFS URL of badge image
  metadata_url TEXT, -- IPFS URL of full metadata JSON
  contract_id TEXT, -- Stellar contract ID
  token_id TEXT, -- On-chain token ID
  transaction_hash TEXT, -- Stellar transaction hash
  is_soul_bound BOOLEAN DEFAULT TRUE, -- Non-transferable
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for nft_certificates table
CREATE INDEX idx_nfts_user ON nft_certificates(user_id, created_at DESC);
CREATE INDEX idx_nfts_type ON nft_certificates(nft_type);
CREATE INDEX idx_nfts_claim ON nft_certificates(claim_id);

-- =============================================
-- TABLE 8: leaderboard_cache
-- =============================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'country', 'city', 'university', 'district')),
  scope_value TEXT, -- e.g., "ULIMA", "Lima", "Miraflores"
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  missions_completed INTEGER NOT NULL,
  user_name TEXT,
  user_avatar_url TEXT,
  user_level INTEGER,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, scope, scope_value, user_id, period_start)
);

-- Indexes for leaderboard_cache table
CREATE INDEX idx_leaderboard_lookup ON leaderboard_cache(
  period, scope, scope_value, rank
) WHERE rank <= 100; -- Only cache top 100
CREATE INDEX idx_leaderboard_user ON leaderboard_cache(user_id, period);
CREATE INDEX idx_leaderboard_updated ON leaderboard_cache(last_updated);

-- =============================================
-- TABLE 9: validation_queue
-- =============================================
CREATE TABLE IF NOT EXISTS validation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID UNIQUE NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  ai_confidence NUMERIC(5, 4),
  requires_manual_review BOOLEAN DEFAULT TRUE,
  flags JSONB, -- AI-detected issues (e.g., {"duplicate_photo": true})
  assigned_validator_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for validation_queue table
CREATE INDEX idx_queue_pending ON validation_queue(priority DESC, created_at)
  WHERE assigned_validator_id IS NULL;
CREATE INDEX idx_queue_assigned ON validation_queue(assigned_validator_id, assigned_at);

-- =============================================
-- TABLE 10: audit_logs
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- e.g., "claim_approved", "voucher_redeemed"
  entity_type TEXT NOT NULL, -- e.g., "claim", "voucher", "user"
  entity_id UUID,
  details JSONB, -- Full action data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_products_updated_at BEFORE UPDATE ON sponsor_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate distance from mission on claim insert
CREATE OR REPLACE FUNCTION calculate_claim_distance()
RETURNS TRIGGER AS $$
DECLARE
  mission_point GEOGRAPHY;
  claim_point GEOGRAPHY;
  distance_m NUMERIC;
BEGIN
  -- Get mission location
  SELECT location INTO mission_point
  FROM missions
  WHERE id = NEW.mission_id;

  -- Create claim point
  claim_point := ST_SetSRID(ST_MakePoint(NEW.gps_longitude, NEW.gps_latitude), 4326)::GEOGRAPHY;

  -- Calculate distance in meters
  distance_m := ST_Distance(mission_point, claim_point);

  NEW.distance_from_mission := distance_m;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_distance_before_insert BEFORE INSERT ON claims
  FOR EACH ROW EXECUTE FUNCTION calculate_claim_distance();

-- Function: Update user streak on claim approval
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validation_status = 'approved' AND OLD.validation_status != 'approved' THEN
    UPDATE users
    SET
      last_claim_date = CURRENT_DATE,
      current_streak = CASE
        WHEN last_claim_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_claim_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(longest_streak, CASE
        WHEN last_claim_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        ELSE 1
      END),
      total_missions_completed = total_missions_completed + 1,
      total_bags_collected = total_bags_collected + NEW.bags_collected
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_after_approval AFTER UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- =============================================
-- Uncomment to enable RLS (requires proper Supabase auth setup)

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can read their own data
-- CREATE POLICY "Users can view own profile" ON users
--   FOR SELECT USING (auth.uid() = id);

-- =============================================
-- SEED DATA (Optional - for development)
-- =============================================

-- Insert admin user (replace with actual Stellar address)
INSERT INTO users (
  stellar_address,
  name,
  is_admin,
  is_validator,
  total_points,
  level
) VALUES (
  'GDEODUGRGDLD6HSIINDJ52YXBORIST5PYGEPC33CPFVVAA6G5WK6MAHN',
  'Admin',
  TRUE,
  TRUE,
  0,
  1
) ON CONFLICT (stellar_address) DO NOTHING;

-- Insert sample sponsor product
INSERT INTO sponsor_products (
  sponsor_name,
  product_name,
  product_description,
  category,
  points_cost,
  stock_available
) VALUES (
  'Tottus',
  'Kit arroz 1kg',
  'Arroz blanco premium 1kg',
  'alimentos',
  250,
  100
),
(
  'Metro',
  'Aceite vegetal 1L',
  'Aceite vegetal Primor 1L',
  'alimentos',
  300,
  50
),
(
  'Tai Loy',
  'Útiles escolares',
  'Kit de útiles escolares básicos',
  'utiles',
  180,
  75
) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'EcoBonus database schema created successfully!';
  RAISE NOTICE 'Total tables: 10';
  RAISE NOTICE 'Triggers: 4';
  RAISE NOTICE 'Indexes: 30+';
END $$;
