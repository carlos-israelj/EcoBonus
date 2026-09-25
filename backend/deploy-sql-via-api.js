import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const projectRef = 'rjeerpnshosuljapunyo'; // From Supabase URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Deploying SQL function via Supabase Management API...\n');

async function deploySQLFunction() {
  try {
    const sqlContent = fs.readFileSync('create-function-only.sql', 'utf8');

    console.log('📋 SQL to execute:');
    console.log('─'.repeat(60));
    console.log(sqlContent);
    console.log('─'.repeat(60));
    console.log('\n🔑 Using Management API...\n');

    // Supabase Management API endpoint for executing SQL
    const url = `https://${projectRef}.supabase.co/rest/v1/rpc`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('   Response:', errorText);
      console.log('\n💡 Alternative: Use psql or Supabase Dashboard\n');
      process.exit(1);
    }

    console.log('✅ SQL executed successfully!\n');
    console.log('🔍 Verifying function exists...\n');

    // Verify by calling the function
    const verifyUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/missions_nearby`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        user_lat: -12.116373,
        user_lon: -77.031105,
        radius_meters: 1000
      })
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('⚠️  Verification failed:', errorText);
    } else {
      const data = await verifyResponse.json();
      console.log('✅ Function verified and working!');
      console.log(`   Found ${data.length} missions\n`);

      if (data.length > 0) {
        console.log('📍 Test Results:');
        data.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title} - ${m.distance_meters}m away`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please execute SQL manually in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql\n');
    process.exit(1);
  }
}

deploySQLFunction();
