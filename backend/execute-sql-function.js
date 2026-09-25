import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Executing SQL function in Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

async function executeSQLFunction() {
  try {
    const sqlContent = fs.readFileSync('create-function-only.sql', 'utf8');

    console.log('📋 SQL Function to execute:');
    console.log('─'.repeat(60));
    console.log(sqlContent.substring(0, 200) + '...');
    console.log('─'.repeat(60));
    console.log('\n⚠️  Note: Supabase client cannot execute raw SQL DDL statements.\n');
    console.log('📝 Manual Steps Required:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql');
    console.log('2. Paste the SQL from create-function-only.sql');
    console.log('3. Click "Run"\n');
    console.log('🔍 Checking if function already exists...\n');

    // Test if function exists by calling it
    const { data, error } = await supabase.rpc('missions_nearby', {
      user_lat: -12.116373,
      user_lon: -77.031105,
      radius_meters: 1000
    });

    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('could not find')) {
        console.log('❌ Function does NOT exist yet in Supabase');
        console.log('   Error:', error.message);
        console.log('\n✋ Please execute the SQL manually in Supabase Dashboard\n');
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log('✅ Function EXISTS and is working!');
    console.log(`   Found ${data.length} missions\n`);

    if (data.length > 0) {
      console.log('📍 Test Results:');
      data.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.title} - ${m.distance_meters}m away`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQLFunction();
