import { z } from 'zod'

/**
 * Variables de entorno del frontend. Todo lo que empieza con VITE_ llega al navegador,
 * así que acá solo puede haber datos públicos (regla 4 de CLAUDE.md).
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.url({ message: 'VITE_SUPABASE_URL tiene que ser una URL.' }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, { message: 'Falta VITE_SUPABASE_PUBLISHABLE_KEY.' })
    .refine((key) => !isSecretKey(key), {
      message:
        'VITE_SUPABASE_PUBLISHABLE_KEY tiene una clave secreta. Usá la clave publicable: la secreta nunca va en el frontend.',
    }),
})

export type Env = z.infer<typeof envSchema>

/** Detecta claves secretas de Supabase: las nuevas (sb_secret_) y las viejas JWT con rol service_role. */
export function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true

  const payload = key.split('.')[1]
  if (payload === undefined) return false
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as unknown
    return typeof json === 'object' && json !== null && 'role' in json && json.role === 'service_role'
  } catch {
    return false
  }
}

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `- ${issue.message}`).join('\n')
    throw new Error(`Configuración incompleta. Revisá .env.local (ver .env.example):\n${problems}`)
  }
  return result.data
}
