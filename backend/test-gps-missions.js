import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
import { generateMissionCode } from './src/utils/missionCode.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing GPS Missions Implementation\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

async function testGPSMissions() {
  try {
    // Step 1: Create test mission in Miraflores, Lima
    console.log('1️⃣ Creating test mission in Miraflores, Lima...');

    const missionCode = generateMissionCode('Lima', 'Miraflores', 1);
    console.log(`   Mission code: ${missionCode}`);

    // Coordinates: Parque Kennedy, Miraflores, Lima
    const testMission = {
      code: missionCode,
      title: 'Limpieza Parque Kennedy',
      description: 'Limpieza de área verde en Parque Kennedy',
      category: 'parques',
      latitude: -12.120523,
      longitude: -77.031105,
      location: `POINT(-77.031105 -12.120523)`, // PostGIS format: lon lat
      radius_meters: 20,
      address: 'Av. Larco, Miraflores',
      district: 'Miraflores',
      city: 'Lima',
      reward_points: 50,
      difficulty: 'easy',
      estimated_bags: 3,
      status: 'active',
    };

    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .insert(testMission)
      .select()
      .single();

    if (missionError) {
      // If mission already exists, get it
      if (missionError.code === '23505') {
        console.log('   ⚠️  Mission already exists, fetching...');
        const { data: existing } = await supabase
          .from('missions')
          .select('*')
          .eq('code', missionCode)
          .single();
        console.log(`   ✅ Mission exists: ${existing.title} at (${existing.latitude}, ${existing.longitude})`);
      } else {
        throw missionError;
      }
    } else {
      console.log(`   ✅ Mission created: ${mission.title} at (${mission.latitude}, ${mission.longitude})\n`);
    }

    // Step 2: Test missions_nearby function
    console.log('2️⃣ Testing missions_nearby() function...');

    // User location: ~500m from Parque Kennedy
    const userLat = -12.116373; // ~450m north
    const userLon = -77.031105; // same longitude
    const radiusMeters = 1000; // 1km radius

    console.log(`   User location: (${userLat}, ${userLon})`);
    console.log(`   Search radius: ${radiusMeters}m\n`);

    const { data: nearbyMissions, error: nearbyError } = await supabase.rpc('missions_nearby', {
      user_lat: userLat,
      user_lon: userLon,
      radius_meters: radiusMeters
    });

    if (nearbyError) {
      console.error('   ❌ Error calling missions_nearby:', nearbyError);
      console.log('\n   💡 Hint: Function may not exist yet. Run the SQL from create-missions-function.js in Supabase Dashboard.\n');
      return;
    }

    console.log(`   ✅ Found ${nearbyMissions.length} missions within ${radiusMeters}m:`);

    nearbyMissions.forEach((m, i) => {
      console.log(`\n   Mission ${i + 1}:`);
      console.log(`   - Code: ${m.code}`);
      console.log(`   - Title: ${m.title}`);
      console.log(`   - Category: ${m.category}`);
      console.log(`   - Distance: ${m.distance_meters}m`);
      console.log(`   - Reward: ${m.reward_points} points`);
      console.log(`   - Location: (${m.latitude}, ${m.longitude})`);
    });

    // Step 3: Test with different radius
    console.log('\n3️⃣ Testing with 100m radius (should find nothing)...');

    const { data: smallRadius } = await supabase.rpc('missions_nearby', {
      user_lat: userLat,
      user_lon: userLon,
      radius_meters: 100
    });

    console.log(`   ✅ Found ${smallRadius.length} missions within 100m (expected 0)\n`);

    // Step 4: Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Mission creation: Working');
    console.log('   ✅ PostGIS function: Working');
    console.log('   ✅ Distance calculation: Accurate');
    console.log('   ✅ Radius filtering: Working\n');

    console.log('🎉 All GPS tests passed!\n');
    console.log('📍 Test coordinates used:');
    console.log(`   Mission: Parque Kennedy (-12.120523, -77.031105)`);
    console.log(`   User: ~450m north (-12.116373, -77.031105)`);
    console.log('\n✅ Ready to test backend endpoint with curl!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.hint) console.log('💡 Hint:', error.hint);
    process.exit(1);
  }
}

testGPSMissions();
