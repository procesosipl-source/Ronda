import { z } from 'zod'

/** Largo mínimo de contraseña. Debe coincidir con el configurado en Supabase Auth. */
export const MIN_PASSWORD_LENGTH = 10

const emailField = z
  .string()
  .trim()
  .min(1, { message: 'Escribí tu email.' })
  .pipe(z.email({ message: 'Revisá el email: parece que le falta algo.' }))

/** Ingreso. La contraseña no se recorta: un espacio puede ser parte de ella. */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: 'Escribí tu contraseña.' }),
})
export type LoginValues = z.infer<typeof loginSchema>

/** Pedido del enlace para recuperar la contraseña. */
export const forgotPasswordSchema = z.object({ email: emailField })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

/** Contraseña nueva, escrita dos veces. */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'Escribí la contraseña nueva.' })
      .min(MIN_PASSWORD_LENGTH, {
        message: `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      }),
    confirmation: z.string().min(1, { message: 'Repetí la contraseña nueva.' }),
  })
  .refine((values) => values.password === values.confirmation, {
    message: 'Las dos contraseñas no coinciden.',
    path: ['confirmation'],
  })
export type NewPasswordValues = z.infer<typeof newPasswordSchema>
