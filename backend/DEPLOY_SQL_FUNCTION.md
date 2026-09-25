# Desplegar SQL Function en Supabase

## Estado Actual

- ✅ Código SQL de function `missions_nearby()` creado
- ✅ Script de testing Node.js listo
- ✅ Endpoint backend `/api/missions/nearby` implementado
- ❌ Function NO desplegada aún en Supabase (requiere acción manual)

## Por qué se requiere despliegue manual

Supabase NO permite ejecutar comandos DDL (CREATE FUNCTION, ALTER TABLE, etc.) via:
- ❌ Supabase Client SDK (`supabase.rpc()` solo llama funciones existentes)
- ❌ REST API (`/rest/v1/rpc` solo ejecuta funciones, no las crea)
- ❌ `psql` directo (Supabase pooler no permite conexiones externas con credenciales estándar)

**Única opción:** Supabase Dashboard SQL Editor

---

## Paso 1: Abrir SQL Editor

🔗 **URL:** https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql

---

## Paso 2: Copiar y pegar este SQL

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

---

## Paso 3: Ejecutar

Click en botón **"Run"** (▶️) en el SQL Editor

**Resultado esperado:**
```
Success. No rows returned
```

---

## Paso 4: Verificar que function existe

Ejecutar este query en el SQL Editor:

```sql
SELECT * FROM missions_nearby(-12.116373, -77.031105, 1000);
```

**Resultado esperado:**
```
code            | title                    | distance_meters
----------------|--------------------------|----------------
LM-MFLOR-0001   | Limpieza Parque Kennedy  | 461
```

Si devuelve 0 rows, la misión no se ha creado aún. Ejecutar `node test-gps-missions.js` primero.

---

## Paso 5: Testear desde Node.js

Una vez desplegada la function, ejecutar:

```bash
node execute-sql-function.js
```

**Resultado esperado:**
```
✅ Function EXISTS and is working!
   Found 1 missions

📍 Test Results:
   1. Limpieza Parque Kennedy - 461m away
```

---

## Paso 6: Testear endpoint backend

Iniciar el servidor:
```bash
npm start
```

En otra terminal, hacer request con curl:
```bash
curl "http://localhost:3001/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=1000"
```

**Resultado esperado:**
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
      "distance_meters": 461,
      "reward_points": 50
    }
  ]
}
```

---

## Troubleshooting

### Error: "Function not found"
**Solución:** Ejecutar el SQL del Paso 2 en Supabase Dashboard

### Error: "No missions found"
**Opciones:**
1. Misión no creada → Ejecutar `node test-gps-missions.js`
2. Radius muy pequeño → Aumentar radius en el request
3. Mission `status != 'active'` → Verificar en DB

### Error: "ST_Distance does not exist"
**Solución:** PostGIS extension no instalada. Ejecutar en SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## Archivos de referencia

- `create-function-only.sql` - SQL standalone
- `execute-sql-function.js` - Verificador de function
- `test-gps-missions.js` - Test completo con creación de misión
- `README_GPS_TESTING.md` - Guía detallada de testing

---

**Creado:** 2026-09-24
**Sprint:** 1 - GPS Mission Discovery
**Status:** Pendiente ejecución manual en Supabase Dashboard
