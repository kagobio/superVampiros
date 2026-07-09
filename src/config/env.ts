/**
 * Variables de entorno de la sincronización (opcional). Si no están definidas,
 * la app funciona igual en modo 100% local. Se configuran en `.env.local`
 * (desarrollo) y en las variables de entorno de Netlify (producción).
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** ¿Está la sincronización configurada (hay credenciales de Supabase)? */
export const isSyncConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
