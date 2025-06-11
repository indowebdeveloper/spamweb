import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key for server-side operations
// This has admin privileges and should only be used in secure server contexts
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Create a Supabase client with the anon key for client-side operations
// This has limited privileges and can be used in browser contexts
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { supabaseAdmin as supabase, supabaseClient };
