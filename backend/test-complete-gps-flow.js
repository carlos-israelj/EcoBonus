import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
import { generateMissionCode } from './src/utils/missionCode.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

console.log('\n🧪 GPS Missions - Complete End-to-End Test\n');
console.log('─'.repeat(70));

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

// Test coordinates (Lima, Peru)
const TEST_MISSION = {
  city: 'Lima',
  district: 'Miraflores',
  title: 'Limpieza Parque Kennedy',
  description: 'Limpieza de área verde en Parque Kennedy',
  category: 'parques',
  latitude: -12.120523,
  longitude: -77.031105,
  address: 'Av. Larco, Miraflores',
  reward_points: 50,
  difficulty: 'easy',
  estimated_bags: 3,
};

const TEST_USERS = [
  { name: 'User cerca (461m)', lat: -12.116373, lon: -77.031105, radius: 1000, should_find: true },
  { name: 'User muy cerca (100m radius)', lat: -12.116373, lon: -77.031105, radius: 100, should_find: false },
  { name: 'User en ubicación exacta', lat: -12.120523, lon: -77.031105, radius: 50, should_find: true },
  { name: 'User lejos (5km)', lat: -12.046373, lon: -77.042754, radius: 5000, should_find: false },
];

async function test1_CheckFunction() {
  console.log('\n✅ TEST 1: Verificar que function missions_nearby() existe\n');

  try {
    const { data, error } = await supabase.rpc('missions_nearby', {
      user_lat: -12.116373,
      user_lon: -77.031105,
      radius_meters: 1000
    });

    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('could not find')) {
        console.log('   ❌ FAIL: Function NO existe en Supabase');
        console.log(`   Error: ${error.message}\n`);
        console.log('   📝 Acción requerida:');
        console.log('      1. Ir a https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql');
        console.log('      2. Copiar SQL de: create-function-only.sql');
        console.log('      3. Ejecutar SQL\n');
        console.log('   Ver: DEPLOY_SQL_FUNCTION.md para detalles\n');
        return false;
      }
      throw error;
    }

    console.log('   ✅ PASS: Function existe y responde');
    console.log(`   Encontró: ${data.length} misiones\n`);
    return true;

  } catch (error) {
    console.error('   ❌ ERROR:', error.message);
    return false;
  }
}

async function test2_CreateMission() {
  console.log('✅ TEST 2: Crear misión de prueba en Parque Kennedy\n');

  try {
    const missionCode = generateMissionCode(TEST_MISSION.city, TEST_MISSION.district, 1);

    const missionData = {
      code: missionCode,
      title: TEST_MISSION.title,
      description: TEST_MISSION.description,
      category: TEST_MISSION.category,
      latitude: TEST_MISSION.latitude,
      longitude: TEST_MISSION.longitude,
      location: `POINT(${TEST_MISSION.longitude} ${TEST_MISSION.latitude})`,
      radius_meters: 20,
      address: TEST_MISSION.address,
      district: TEST_MISSION.district,
      city: TEST_MISSION.city,
      reward_points: TEST_MISSION.reward_points,
      difficulty: TEST_MISSION.difficulty,
      estimated_bags: TEST_MISSION.estimated_bags,
      status: 'active',
    };

    const { data: mission, error } = await supabase
      .from('missions')
      .insert(missionData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log(`   ⚠️  Misión "${missionCode}" ya existe`);
        const { data: existing } = await supabase
          .from('missions')
          .select('*')
          .eq('code', missionCode)
          .single();
        console.log(`   ✅ PASS: Usando misión existente`);
        console.log(`   📍 ${existing.title} en (${existing.latitude}, ${existing.longitude})\n`);
        return true;
      }
      throw error;
    }

    console.log(`   ✅ PASS: Misión creada: ${missionCode}`);
    console.log(`   📍 ${mission.title} en (${mission.latitude}, ${mission.longitude})\n`);
    return true;

  } catch (error) {
    console.error('   ❌ FAIL:', error.message);
    return false;
  }
}

async function test3_TestSupabaseRPC() {
  console.log('✅ TEST 3: Probar function missions_nearby() con diferentes radios\n');

  let allPassed = true;

  for (const testUser of TEST_USERS) {
    try {
      const { data: missions, error } = await supabase.rpc('missions_nearby', {
        user_lat: testUser.lat,
        user_lon: testUser.lon,
        radius_meters: testUser.radius
      });

      if (error) throw error;

      const found = missions.length > 0;
      const passed = found === testUser.should_find;

      if (passed) {
        console.log(`   ✅ ${testUser.name}`);
        console.log(`      Radius: ${testUser.radius}m | Encontró: ${missions.length} misiones`);
        if (missions.length > 0) {
          missions.forEach(m => {
            console.log(`      → ${m.code}: ${m.title} (${m.distance_meters}m)`);
          });
        }
      } else {
        console.log(`   ❌ ${testUser.name}`);
        console.log(`      Esperaba: ${testUser.should_find ? 'encontrar' : 'no encontrar'}`);
        console.log(`      Obtuvo: ${missions.length} misiones`);
        allPassed = false;
      }

    } catch (error) {
      console.error(`   ❌ ${testUser.name}: ${error.message}`);
      allPassed = false;
    }
  }

  console.log();
  return allPassed;
}

async function test4_TestBackendAPI() {
  console.log('✅ TEST 4: Probar endpoint backend /api/missions/nearby\n');

  let allPassed = true;

  for (const testUser of TEST_USERS.slice(0, 2)) { // Test first 2 scenarios
    try {
      const url = `${backendUrl}/api/missions/nearby?lat=${testUser.lat}&lon=${testUser.lon}&radius=${testUser.radius}`;

      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        console.log(`   ❌ ${testUser.name}`);
        console.log(`      HTTP ${response.status}: ${json.error || json.message}`);
        allPassed = false;
        continue;
      }

      const found = json.count > 0;
      const passed = found === testUser.should_find;

      if (passed) {
        console.log(`   ✅ ${testUser.name}`);
        console.log(`      HTTP 200 | Count: ${json.count} misiones`);
        if (json.data.length > 0) {
          json.data.forEach(m => {
            console.log(`      → ${m.code}: ${m.title} (${m.distance_meters}m)`);
          });
        }
      } else {
        console.log(`   ❌ ${testUser.name}`);
        console.log(`      Esperaba: ${testUser.should_find ? 'encontrar' : 'no encontrar'}`);
        console.log(`      Obtuvo: ${json.count} misiones`);
        allPassed = false;
      }

    } catch (error) {
      if (error.cause?.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  Backend no está corriendo en ${backendUrl}`);
        console.log(`      Ejecuta: npm start\n`);
        return false;
      }
      console.error(`   ❌ ${testUser.name}: ${error.message}`);
      allPassed = false;
    }
  }

  console.log();
  return allPassed;
}

async function runAllTests() {
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
  };

  results.test1 = await test1_CheckFunction();

  if (!results.test1) {
    console.log('❌ Tests abortados: Function no existe\n');
    console.log('📝 Siguiente paso: Ejecutar SQL en Supabase Dashboard');
    console.log('   Ver: DEPLOY_SQL_FUNCTION.md\n');
    process.exit(1);
  }

  results.test2 = await test2_CreateMission();
  results.test3 = await test3_TestSupabaseRPC();
  results.test4 = await test4_TestBackendAPI();

  console.log('─'.repeat(70));
  console.log('\n📊 RESUMEN DE TESTS:\n');
  console.log(`   ${results.test1 ? '✅' : '❌'} Test 1: Function exists`);
  console.log(`   ${results.test2 ? '✅' : '❌'} Test 2: Mission creation`);
  console.log(`   ${results.test3 ? '✅' : '❌'} Test 3: Supabase RPC`);
  console.log(`   ${results.test4 ? '✅' : '❌'} Test 4: Backend API`);

  const allPassed = Object.values(results).every(r => r === true);

  console.log(`\n${allPassed ? '🎉' : '⚠️'} ${allPassed ? 'TODOS LOS TESTS PASARON!' : 'ALGUNOS TESTS FALLARON'}\n`);

  if (allPassed) {
    console.log('✅ GPS Mission Discovery está completamente funcional!');
    console.log('✅ Listo para continuar con Sprint 2: Photo Validation\n');
  } else {
    console.log('📝 Revisar errores arriba y corregir\n');
  }

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
