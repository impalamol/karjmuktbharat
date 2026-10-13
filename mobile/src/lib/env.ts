/** Without Supabase keys the app runs in demo mode on sample data. */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY
