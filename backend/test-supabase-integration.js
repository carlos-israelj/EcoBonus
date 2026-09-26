import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rjeerpnshosuljapunyo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZWVycG5zaG9zdWxqYXB1bnlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI4ODAzNSwiZXhwIjoyMTA1ODY0MDM1fQ.HUeEgudYTBDH-caonfznloUdSnbkYenrYA2b-EUXHyM'
);

console.log('🧪 Testing Supabase Integration\n');

// Test 1: Users table
console.log('1️⃣  Testing users table...');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*')
  .limit(3);

if (usersError) {
  console.log('  ❌ Error:', usersError.message);
} else {
  console.log(\`  ✅ Users table accessible (\${users.length} users found)\`);
}

// Test 2: Missions table
console.log('\n2️⃣  Testing missions table...');
const { data: missions, error: missionsError } = await supabase
  .from('missions')
  .select('*')
  .limit(3);

if (missionsError) {
  console.log('  ❌ Error:', missionsError.message);
} else {
  console.log(\`  ✅ Missions table accessible (\${missions.length} missions found)\`);
  if (missions.length > 0) {
    console.log(\`  📍 Example: \${missions[0].code} - \${missions[0].title}\`);
  }
}

// Test 3: Sponsor products table
console.log('\n3️⃣  Testing sponsor_products table...');
const { data: products, error: productsError } = await supabase
  .from('sponsor_products')
  .select('*')
  .limit(3);

if (productsError) {
  console.log('  ❌ Error:', productsError.message);
} else {
  console.log(\`  ✅ Sponsor products table accessible (\${products.length} products found)\`);
  if (products.length > 0) {
    console.log(\`  🎁 Example: \${products[0].product_name} - \${products[0].points_cost} pts\`);
  }
}

// Test 4: Points ledger table
console.log('\n4️⃣  Testing points_ledger table...');
const { data: points, error: pointsError } = await supabase
  .from('points_ledger')
  .select('*')
  .limit(3);

if (pointsError) {
  console.log('  ❌ Error:', pointsError.message);
} else {
  console.log(\`  ✅ Points ledger table accessible (\${points.length} transactions found)\`);
}

// Test 5: GPS function
console.log('\n5️⃣  Testing missions_nearby() function...');
const { data: nearbyMissions, error: rpcError } = await supabase.rpc('missions_nearby', {
  user_lat: -12.116373,
  user_lon: -77.031105,
  search_radius_meters: 1000
});

if (rpcError) {
  console.log('  ❌ Error:', rpcError.message);
} else {
  console.log(\`  ✅ GPS function working (\${nearbyMissions.length} missions found)\`);
  if (nearbyMissions.length > 0) {
    console.log(\`  📍 \${nearbyMissions[0].code}: \${nearbyMissions[0].distance_meters}m away\`);
  }
}

console.log('\n✅ Supabase integration tests complete!');
