import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

export type Validation<TValues> =
  | { ok: true; values: TValues }
  | { ok: false; errors: Partial<Record<keyof TValues & string, string>> }

/** Valida con un esquema de zod y devuelve el primer error de cada campo. */
export function validate<TValues extends FieldValues>(
  schema: z.ZodType<TValues>,
  input: unknown,
): Validation<TValues> {
  const result = schema.safeParse(input)
  if (result.success) return { ok: true, values: result.data }

  const errors: Partial<Record<string, string>> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && errors[field] === undefined) {
      errors[field] = issue.message
    }
  }
  return { ok: false, errors }
}

/**
 * Conecta un esquema de zod con react-hook-form. Reemplaza a `@hookform/resolvers`,
 * que por ahora no instalamos (ver contexto §13).
 */
export function schemaResolver<TValues extends FieldValues>(schema: z.ZodType<TValues>): Resolver<TValues> {
  return (values) => {
    const validation = validate(schema, values)
    if (validation.ok) return { values: validation.values, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const [field, message] of Object.entries(validation.errors)) {
      if (message !== undefined) errors[field] = { type: 'validation', message }
    }
    return { values: {}, errors: errors as FieldErrors<TValues> }
  }
}
