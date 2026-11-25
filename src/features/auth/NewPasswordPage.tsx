import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { FormField } from '../../components/FormField'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from './authErrors'
import { MIN_PASSWORD_LENGTH, newPasswordSchema, type NewPasswordValues } from './authForms'
import { useAuth } from './authContext'
import { LoadingScreen } from './RequireAuth'

/**
 * Se llega desde el enlace del mail. Supabase lee el enlace al cargar la página
 * y abre una sesión temporal que permite cambiar la contraseña.
 */
export function NewPasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: schemaResolver(newPasswordSchema),
    defaultValues: { password: '', confirmation: '' },
  })

  if (auth.status === 'loading') return <LoadingScreen />

  if (auth.status === 'signedOut') {
    return (
      <AuthLayout title="El enlace ya no sirve">
        <div className="flex flex-col gap-4">
          <p className="text-ink-2">
            Puede que haya vencido o que ya lo hayas usado. Pedí uno nuevo y usalo en la próxima hora.
          </p>
          <Link to="/recuperar-contrasena" className={`mx-auto ${tertiaryButtonClass}`}>
            Pedir un enlace nuevo
          </Link>
        </div>
      </AuthLayout>
    )
  }

  const onSubmit = async ({ password }: NewPasswordValues) => {
    setErrorMessage(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error !== null) {
      setErrorMessage(authErrorMessage(error))
      return
    }
    await navigate('/', { replace: true, state: { notice: 'Listo, ya cambiaste tu contraseña.' } })
  }

  return (
    <AuthLayout
      title="Elegí una contraseña nueva"
      description={`Tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres. Una frase corta es fácil de recordar y difícil de adivinar.`}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="password"
          label="Contraseña nueva"
          revealable
          error={errors.password?.message}
          inputProps={{ autoComplete: 'new-password', ...register('password') }}
        />
        <FormField
          id="confirmation"
          label="Repetí la contraseña"
          revealable
          error={errors.confirmation?.message}
          inputProps={{ autoComplete: 'new-password', ...register('confirmation') }}
        />

        {errorMessage !== null && <Notice tone="danger">{errorMessage}</Notice>}

        <button type="submit" disabled={isSubmitting} className={`mt-1 ${primaryButtonClass}`}>
          {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthLayout>
  )
}
