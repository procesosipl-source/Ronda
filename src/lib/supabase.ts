import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { parseEnv } from './env'

const env = parseEnv(import.meta.env)

/**
 * Cliente de Supabase del navegador. Usa solo la clave publicable:
 * lo que cada persona puede ver o hacer lo decide RLS en la base (regla 3), no este cliente.
 *
 * `Database` son los tipos generados desde la base local. Se regeneran después de cada migración con:
 *   npx supabase gen types typescript --local --schema public > src/lib/database.types.ts
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
