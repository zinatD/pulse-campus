import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client for the entire application
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create and export a singleton instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
