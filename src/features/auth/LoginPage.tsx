import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { loginResolver, type LoginValues } from './loginForm'

/**
 * Pantalla de ingreso. Por ahora es solo visual: el ingreso real con Supabase
 * se conecta en la semana 2 del plan (docs/plan.md).
 */
export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: loginResolver,
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = () => {
    setNotice('El ingreso todavía no está habilitado. Llega en los próximos días.')
  }

  const onForgotPassword = () => {
    setNotice('Recuperar la contraseña todavía no está habilitado. Llega junto con el ingreso.')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section className="w-full max-w-[400px] rounded-card border border-line bg-surface p-7 shadow-card sm:p-8">
        <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="h-[30px]" />

        <h1 className="mt-7 text-[1.6rem] font-semibold">Ingresá a Ronda</h1>
        <p className="mt-1 text-ink-2">Usá el email y la contraseña de tu cuenta.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[0.84rem] font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-invalid={errors.email !== undefined}
              aria-describedby={errors.email !== undefined ? 'email-error' : undefined}
              className={`h-11 rounded-control border bg-surface px-3 text-ink ${
                errors.email !== undefined ? 'border-danger' : 'border-line'
              }`}
              {...register('email')}
            />
            {errors.email?.message !== undefined && (
              <p id="email-error" className="text-[0.84rem] text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[0.84rem] font-semibold">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={errors.password !== undefined}
                aria-describedby={errors.password !== undefined ? 'password-error' : undefined}
                className={`h-11 w-full rounded-control border bg-surface pr-20 pl-3 text-ink ${
                  errors.password !== undefined ? 'border-danger' : 'border-line'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 min-w-16 rounded-control px-3 text-[0.84rem] font-semibold text-primary hover:bg-primary-soft"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {errors.password?.message !== undefined && (
              <p id="password-error" className="text-[0.84rem] text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          {notice !== null && (
            <p role="status" className="rounded-control bg-warn-soft px-3 py-2.5 text-[0.84rem] text-warn">
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="mt-1 h-11 rounded-control bg-primary font-semibold text-primary-ink hover:bg-primary-hover"
          >
            Ingresar
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            className="mx-auto min-h-10 rounded-control px-3 text-[0.84rem] font-semibold text-primary hover:bg-primary-soft"
          >
            Olvidé mi contraseña
          </button>
        </form>
      </section>

      <p className="mt-6 text-[0.76rem] text-ink-3">Ronda · IPL – Ingeniería de Procesos Luján</p>
    </main>
  )
}
