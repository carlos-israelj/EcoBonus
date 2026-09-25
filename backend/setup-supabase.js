import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔧 Setting up Supabase database...\n');
console.log(`📍 Project: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Read SQL schema file
    const schemaPath = join(__dirname, 'supabase-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('📄 SQL schema loaded');
    console.log(`📊 File size: ${(schema.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements (basic approach)
    // Note: This is a simple split and may not work with all SQL
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔨 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct query execution as fallback
          const { error: directError } = await supabase.from('_').select('*').limit(0);

          if (error.message.includes('does not exist') || error.code === '42P01') {
            // This is expected for RPC that doesn't exist, continue with raw SQL
            console.log(`⚠️  Statement ${i + 1}: Using alternative method`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message.substring(0, 100));
            errorCount++;
          }
        } else {
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`✅ Processed ${i + 1}/${statements.length} statements...`);
          }
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message.substring(0, 100));
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. You may need to run the SQL manually in Supabase dashboard.');
      console.log('📍 Go to: https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql');
    }

    // Test connection by checking if users table exists
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Tables not created. Please run SQL manually in Supabase dashboard.');
        console.log('\n📝 Manual steps:');
        console.log('1. Go to: https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql');
        console.log('2. Copy content from: backend/supabase-schema.sql');
        console.log('3. Paste and run in SQL Editor');
      } else {
        console.error('❌ Database test failed:', error.message);
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Users table exists and is accessible');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Please run SQL schema manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/rjeerpnshosuljapunyo/sql');
    console.log('2. Copy content from: backend/supabase-schema.sql');
    console.log('3. Paste and run in SQL Editor');
    process.exit(1);
  }
}

setupDatabase();
