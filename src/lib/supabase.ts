import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hjtuvyxylsfxofwtuklu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdHV2eXh5bHNmeG9md3R1a2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDkzODMsImV4cCI6MjA5NzEyNTM4M30.5RL6mALrE5UjmP8XJ9IRteD83U0Yco_sWLy8pwJ9y9k';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
