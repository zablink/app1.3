// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// Environment variables are assumed to be present in Vercel/Next.js setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Use console.error instead of throwing in production to avoid hard crash
  console.error("FATAL: Supabase environment variables (URL/Key) are missing.");
}

// Export the initialized client
export const supabase = createClient(supabaseUrl || 'http://dummy.url', supabaseAnonKey || 'dummy_key');

// Interface for the data returned by the Supabase RPC function
export interface LocationInfo {
  tambon_id: string;
  tambon_name_th: string;
  amphure_name_th: string;
  province_name_th: string;
}
