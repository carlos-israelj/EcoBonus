# GPS Missions Testing Guide

## Status

✅ Mission created: "Limpieza Parque Kennedy" in Miraflores, Lima
❌ SQL Function `missions_nearby()` needs to be created in Supabase
✅ Backend endpoint ready: `GET /api/missions/nearby`

---

## Step 1: Create SQL Function in Supabase Dashboard

**🔗 Go to:** https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql

**📝 Paste this SQL:**

```sql
CREATE OR REPLACE FUNCTION missions_nearby(
  user_lat NUMERIC,
  user_lon NUMERIC,
  radius_meters INTEGER DEFAULT 5000
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
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
```

**✅ Click "Run"**

---

## Step 2: Test SQL Function Directly in Supabase

Run this query to verify:

```sql
SELECT * FROM missions_nearby(-12.116373, -77.031105, 1000);
```

**Expected result:**
```
code         | title                         | distance_meters
-------------|-------------------------------|----------------
LM-MFLOR-0001| Limpieza Parque Kennedy       | 461
```

---

## Step 3: Test Node.js Integration

```bash
node test-gps-missions.js
```

**Expected output:**
```
🧪 Testing GPS Missions Implementation

1️⃣ Creating test mission in Miraflores, Lima...
   Mission code: LM-MFLOR-0001
   ✅ Mission created (or exists)

2️⃣ Testing missions_nearby() function...
   ✅ Found 1 missions within 1000m:

   Mission 1:
   - Code: LM-MFLOR-0001
   - Title: Limpieza Parque Kennedy
   - Distance: 461m
   - Reward: 50 points

3️⃣ Testing with 100m radius...
   ✅ Found 0 missions (expected)

🎉 All GPS tests passed!
```

---

## Step 4: Test Backend API Endpoint

### Start backend server:
```bash
npm start
```

### Test with curl:
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=1000"
```

**Expected response:**
```json
{
  "success": true,
  "count": 1,
  "radius_meters": 1000,
  "center": {
    "latitude": -12.116373,
    "longitude": -77.031105
  },
  "data": [
    {
      "id": "uuid-here",
      "code": "LM-MFLOR-0001",
      "title": "Limpieza Parque Kennedy",
      "category": "parques",
      "latitude": -12.120523,
      "longitude": -77.031105,
      "address": "Av. Larco, Miraflores",
      "district": "Miraflores",
      "reward_points": 50,
      "difficulty": "easy",
      "distance_meters": 461,
      "status": "active"
    }
  ]
}
```

---

## Test Coordinates (Lima, Peru)

### Mission Location:
- **Parque Kennedy, Miraflores**
- Lat: `-12.120523`
- Lon: `-77.031105`

### Test User Locations:

**1. Within 1km (should find mission):**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=1000"
# Distance: ~461m
```

**2. Within 5km (should find mission):**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.046373&lon=-77.042754&radius=5000"
# Distance: ~8.3km (too far, won't find)
```

**3. Within 100m (should NOT find):**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=100"
# Distance: 461m (outside radius)
```

**4. Exact location (should find):**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.120523&lon=-77.031105&radius=50"
# Distance: 0m (exact match)
```

---

## Error Handling Tests

**Missing parameters:**
```bash
curl "http://localhost:3001/api/missions/nearby"
# Expected: 400 Bad Request - "Missing required parameters: lat, lon"
```

**Invalid coordinates:**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=invalid&lon=-77.031105"
# Expected: 400 Bad Request - "Invalid parameters"
```

**Out of range:**
```bash
curl "http://localhost:3001/api/missions/nearby?lat=999&lon=-77.031105"
# Expected: 400 Bad Request - "Invalid coordinates"
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ GPS mission discovery working
2. ⏭️ Continue with Sprint 2: Before/After Photo Validation
   - Install `exif-parser` + `sharp`
   - Validate GPS coordinates in photo EXIF
   - Compare photo location vs mission location
   - Implement perceptual hashing

---

## Troubleshooting

### Function not found error:
```
Could not find the function public.missions_nearby
```
**Solution:** Run the SQL from Step 1 in Supabase Dashboard

### No missions found:
**Check:**
1. Mission exists: `SELECT * FROM missions WHERE code = 'LM-MFLOR-0001';`
2. Mission is active: `status = 'active'`
3. Coordinates are correct
4. Radius is large enough

### Distance calculation wrong:
**Verify:**
- PostGIS extension enabled: `SELECT PostGIS_version();`
- Location stored as geography: `SELECT location FROM missions LIMIT 1;`

---

**Created:** 2026-09-24
**Sprint:** 1 - GPS Mission Discovery
**Status:** Ready for manual SQL execution in Supabase Dashboard
