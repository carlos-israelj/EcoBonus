-- EcoBonus Database Schema
-- PostgreSQL database for caching blockchain data and analytics

-- Users table
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(56) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    avatar_uri TEXT,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reputation ON users(reputation_score DESC);

-- Missions cache table
CREATE TABLE IF NOT EXISTS missions (
    id BIGINT PRIMARY KEY,
    creator_address VARCHAR(56) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    latitude BIGINT NOT NULL,
    longitude BIGINT NOT NULL,
    radius INTEGER NOT NULL,
    reward_amount BIGINT NOT NULL,
    max_claimers INTEGER NOT NULL,
    deadline BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    metadata_uri TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_missions_location ON missions(latitude, longitude);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_deadline ON missions(deadline);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id BIGSERIAL PRIMARY KEY,
    mission_id BIGINT NOT NULL,
    claimer_address VARCHAR(56) NOT NULL,
    proof_uri TEXT NOT NULL,
    latitude BIGINT,
    longitude BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    validation_score DECIMAL(5,2),
    ai_analysis JSONB,
    reward_amount BIGINT,
    blockchain_tx VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (claimer_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_claims_mission ON claims(mission_id);
CREATE INDEX idx_claims_claimer ON claims(claimer_address);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created ON claims(created_at DESC);

-- Certificates (NFT) cache table
CREATE TABLE IF NOT EXISTS certificates (
    token_id BIGINT PRIMARY KEY,
    owner_address VARCHAR(56) NOT NULL,
    mission_id BIGINT NOT NULL,
    claim_id BIGINT NOT NULL,
    weight_kg INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL,
    carbon_offset INTEGER NOT NULL,
    proof_uri TEXT NOT NULL,
    minted_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

CREATE INDEX idx_certificates_owner ON certificates(owner_address);
CREATE INDEX idx_certificates_mission ON certificates(mission_id);
CREATE INDEX idx_certificates_minted ON certificates(minted_at DESC);

-- Marketplace listings cache
CREATE TABLE IF NOT EXISTS listings (
    token_id BIGINT PRIMARY KEY,
    seller_address VARCHAR(56) NOT NULL,
    price BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (token_id) REFERENCES certificates(token_id) ON DELETE CASCADE,
    FOREIGN KEY (seller_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_listings_price ON listings(price);

-- Analytics: Daily statistics
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE PRIMARY KEY,
    total_missions_created INTEGER DEFAULT 0,
    total_claims_submitted INTEGER DEFAULT 0,
    total_claims_approved INTEGER DEFAULT 0,
    total_rewards_distributed BIGINT DEFAULT 0,
    total_weight_kg INTEGER DEFAULT 0,
    total_carbon_offset INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);

-- Leaderboard materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard AS
SELECT
    u.wallet_address,
    u.username,
    u.avatar_uri,
    COUNT(DISTINCT cl.id) as total_claims,
    COUNT(DISTINCT cl.id) FILTER (WHERE cl.status = 'approved') as approved_claims,
    SUM(cl.reward_amount) FILTER (WHERE cl.status = 'approved') as total_earned,
    SUM(ce.weight_kg) as total_weight_kg,
    SUM(ce.carbon_offset) as total_carbon_offset,
    u.reputation_score
FROM users u
LEFT JOIN claims cl ON u.wallet_address = cl.claimer_address
LEFT JOIN certificates ce ON u.wallet_address = ce.owner_address
GROUP BY u.wallet_address, u.username, u.avatar_uri, u.reputation_score
ORDER BY total_earned DESC NULLS LAST;

CREATE UNIQUE INDEX idx_leaderboard_address ON leaderboard(wallet_address);

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
