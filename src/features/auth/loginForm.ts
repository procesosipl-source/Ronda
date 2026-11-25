import type { FieldErrors, Resolver } from 'react-hook-form'
import { z } from 'zod'

/** Reglas del formulario de ingreso. Los mensajes son los que ve la persona. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Escribí tu email.' })
    .pipe(z.email({ message: 'Revisá el email: parece que le falta algo.' })),
  // La contraseña no se recorta: un espacio puede ser parte de ella.
  password: z.string().min(1, { message: 'Escribí tu contraseña.' }),
})

export type LoginValues = z.infer<typeof loginSchema>

type LoginField = keyof LoginValues

export type LoginValidation =
  | { ok: true; values: LoginValues }
  | { ok: false; errors: Partial<Record<LoginField, string>> }

/** Valida el formulario y devuelve el primer error de cada campo. */
export function validateLogin(input: unknown): LoginValidation {
  const result = loginSchema.safeParse(input)
  if (result.success) return { ok: true, values: result.data }

  const errors: Partial<Record<LoginField, string>> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if ((field === 'email' || field === 'password') && errors[field] === undefined) {
      errors[field] = issue.message
    }
  }
  return { ok: false, errors }
}

/**
 * Conecta la validación con react-hook-form. Reemplaza a `@hookform/resolvers`,
 * que por ahora no instalamos (ver contexto §13).
 */
export const loginResolver: Resolver<LoginValues> = (values) => {
  const validation = validateLogin(values)
  if (validation.ok) return { values: validation.values, errors: {} }

  const errors: FieldErrors<LoginValues> = {}
  for (const [field, message] of Object.entries(validation.errors) as [LoginField, string][]) {
    errors[field] = { type: 'validation', message }
  }
  return { values: {}, errors }
}
