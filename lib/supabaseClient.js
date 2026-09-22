import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://yrrgzfzpntoepvbklvpi.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlycmd6ZnpwbnRvZXB2YmtsdnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMzY4ODAsImV4cCI6MjEwMzgxMjg4MH0._IBv1rX0QF_UaSNpA0NSKtquumcTjcSS0Y8Fd1wPK_E';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

