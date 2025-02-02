import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'batch-sms-frontend',
    },
  },
});

// Test connection and log result
(async () => {
  try {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection test error:', error);
    } else {
      console.log('Supabase connection test successful:', data);
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error);
  }
})();

export default supabase;