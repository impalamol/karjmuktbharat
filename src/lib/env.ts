// Plain checks (no zod) so the validation library stays out of the first-paint bundle.
const raw = import.meta.env

const isUrl = (v: unknown): v is string => {
  try {
    return typeof v === 'string' && new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

/** True when Supabase env vars are present. The UI shows a setup notice instead of crashing when false. */
export const isConfigured = isUrl(raw.VITE_SUPABASE_URL) && typeof raw.VITE_SUPABASE_ANON_KEY === 'string' && raw.VITE_SUPABASE_ANON_KEY.length >= 20

export const env = {
  VITE_SUPABASE_URL: isConfigured ? raw.VITE_SUPABASE_URL : 'https://placeholder.supabase.co',
  VITE_SUPABASE_ANON_KEY: isConfigured ? raw.VITE_SUPABASE_ANON_KEY : 'placeholder-anon-key-not-configured',
  VITE_RAZORPAY_KEY_ID: raw.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_') ? raw.VITE_RAZORPAY_KEY_ID : undefined,
  VITE_SITE_URL: isUrl(raw.VITE_SITE_URL) ? raw.VITE_SITE_URL : 'https://karjmuktbharat.com',
}
