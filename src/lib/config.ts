// Supabase project credentials — import from .env (VITE_* vars via import.meta.env)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Admin user — only this GitHub username can access /admin
export const ADMIN_USER = 'tw2818'

// ⚠️ Service role key — only used for storage deletion, never exposed publicly
export const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
