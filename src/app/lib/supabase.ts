import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phqazdptgglkbjsqllqn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-MVnNlA7cwiXQnyCRc9myQ_nT6nWsEt';

export const supabase = createClient(
  supabaseUrl.startsWith('http') ? supabaseUrl : 'https://phqazdptgglkbjsqllqn.supabase.co',
  supabaseAnonKey
);