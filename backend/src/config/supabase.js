import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn('Supabase credentials not configured. Some features will be unavailable.');
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      logger.warn('Supabase connection test failed:', error.message);
      return false;
    }

    logger.info('Supabase connected successfully');
    return true;
  } catch (error) {
    logger.warn('Supabase connection error:', error.message);
    return false;
  }
}

export default supabase;
