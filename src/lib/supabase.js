import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Role Key for server-side operations

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// NOTE: This client should ONLY be used on the server-side because it uses the CP Service Role Key.
// For client-side operations (if any), we would need a different client with the Anon Key,
// but our architecture seems to rely on Server Actions/API Routes which run on the server.
export const supabase = createClient(supabaseUrl, supabaseKey);
