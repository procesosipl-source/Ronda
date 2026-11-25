import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { FormField } from '../../components/FormField'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from './authErrors'
import { forgotPasswordSchema, type ForgotPasswordValues } from './authForms'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: schemaResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    setErrorMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    })
    // Supabase no avisa si el email no existe, y nosotros tampoco: así nadie averigua quién tiene cuenta.
    if (error !== null) {
      setErrorMessage(authErrorMessage(error))
      return
    }
    setSentTo(email)
  }

  if (sentTo !== null) {
    return (
      <AuthLayout title="Revisá tu mail">
        <div className="flex flex-col gap-4">
          <p className="text-ink-2">
            Si <strong className="font-semibold text-ink">{sentTo}</strong> tiene una cuenta en Ronda, te mandamos un
            enlace para elegir una contraseña nueva. Puede tardar unos minutos; mirá también en correo no deseado.
          </p>
          <Link to="/ingresar" className={`mx-auto ${tertiaryButtonClass}`}>
            Volver a ingresar
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperá tu contraseña"
      description="Escribí el email de tu cuenta y te mandamos un enlace para elegir una nueva."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="email"
          label="Email"
          error={errors.email?.message}
          inputProps={{ type: 'email', autoComplete: 'email', inputMode: 'email', ...register('email') }}
        />

        {errorMessage !== null && <Notice tone="danger">{errorMessage}</Notice>}

        <button type="submit" disabled={isSubmitting} className={`mt-1 ${primaryButtonClass}`}>
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </button>

        <Link to="/ingresar" className={`mx-auto ${tertiaryButtonClass}`}>
          Volver a ingresar
        </Link>
      </form>
    </AuthLayout>
  )
}
