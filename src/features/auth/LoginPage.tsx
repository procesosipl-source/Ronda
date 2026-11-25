import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/AuthLayout'
import { FormField } from '../../components/FormField'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from './authErrors'
import { loginSchema, type LoginValues } from './authForms'
import { useAuth } from './authContext'
import { LoadingScreen } from './RequireAuth'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: schemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // A dónde volver después de ingresar: la página que se quiso abrir, o el inicio.
  const from = readFrom(location.state)

  if (auth.status === 'loading') return <LoadingScreen />
  if (auth.status === 'signedIn' && !isSubmitting) return <Navigate to={from} replace />

  const onSubmit = async (values: LoginValues) => {
    setErrorMessage(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error !== null) {
      setErrorMessage(authErrorMessage(error))
      return
    }
    await navigate(from, { replace: true })
  }

  return (
    <AuthLayout title="Ingresá a Ronda" description="Usá el email y la contraseña de tu cuenta.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="email"
          label="Email"
          error={errors.email?.message}
          inputProps={{ type: 'email', autoComplete: 'email', inputMode: 'email', ...register('email') }}
        />
        <FormField
          id="password"
          label="Contraseña"
          revealable
          error={errors.password?.message}
          inputProps={{ autoComplete: 'current-password', ...register('password') }}
        />

        {errorMessage !== null && <Notice tone="danger">{errorMessage}</Notice>}

        <button type="submit" disabled={isSubmitting} className={`mt-1 ${primaryButtonClass}`}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </button>

        <Link to="/recuperar-contrasena" className={`mx-auto ${tertiaryButtonClass}`}>
          Olvidé mi contraseña
        </Link>
      </form>
    </AuthLayout>
  )
}

function readFrom(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    // Solo rutas internas: nunca redirigir a otro sitio.
    if (state.from.startsWith('/') && !state.from.startsWith('//')) return state.from
  }
  return '/'
}
