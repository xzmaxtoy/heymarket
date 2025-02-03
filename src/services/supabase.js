import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Changed from SUPABASE_KEY to SUPABASE_ANON_KEY

let supabaseClient;

// In development, provide mock client if config is missing
if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Missing Supabase configuration. Using mock client for development.');
    supabaseClient = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    };
  } else {
    throw new Error('Missing Supabase configuration. Please check your .env file.');
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: 'public',
    },
  });
}

export const supabase = supabaseClient;
