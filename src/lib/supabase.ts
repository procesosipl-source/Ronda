import { createClient } from '@supabase/supabase-js'
import { parseEnv } from './env'

const env = parseEnv(import.meta.env)

/**
 * Cliente de Supabase del navegador. Usa solo la clave publicable:
 * lo que cada persona puede ver o hacer lo decide RLS en la base (regla 3), no este cliente.
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
