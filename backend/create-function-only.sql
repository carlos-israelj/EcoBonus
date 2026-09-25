CREATE OR REPLACE FUNCTION missions_nearby(
  user_lat NUMERIC,
  user_lon NUMERIC,
  search_radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  district TEXT,
  reward_points INTEGER,
  difficulty TEXT,
  estimated_bags INTEGER,
  sponsor_name TEXT,
  photo_url TEXT,
  distance_meters INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.code,
    m.title,
    m.description,
    m.category,
    m.latitude,
    m.longitude,
    m.address,
    m.district,
    m.reward_points,
    m.difficulty,
    m.estimated_bags,
    m.sponsor_name,
    m.photo_url,
    ST_Distance(
      m.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    )::INTEGER as distance_meters,
    m.status
  FROM missions m
  WHERE m.status = 'active'
    AND ST_DWithin(
      m.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      search_radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
