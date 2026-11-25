import { useState } from 'react'
import { useLocation } from 'react-router'
import { Notice } from '../components/Notice'
import { useAuth } from '../features/auth/authContext'
import { supabase } from '../lib/supabase'

/** Inicio provisorio con sesión iniciada. El menú y "Hoy" llegan en las semanas 4 y 5 del plan. */
export function HomePage() {
  const auth = useAuth()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)
  const notice = readNotice(location.state)
  const email = auth.status === 'signedIn' ? auth.session.user.email : undefined

  const onSignOut = async () => {
    setSigningOut(true)
    // Cierra la sesión solo en este dispositivo. AuthProvider se entera y lleva a la pantalla de ingreso.
    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section className="w-full max-w-[480px] rounded-card border border-line bg-surface p-7 shadow-card sm:p-8">
        <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="h-[30px]" />
        <h1 className="mt-7 text-[1.6rem] font-semibold">Ya estás adentro</h1>
        <p className="mt-1 text-ink-2">
          Ingresaste como <strong className="font-semibold text-ink">{email}</strong>.
        </p>
        <p className="mt-4 text-ink-2">
          Pronto vas a ver acá el menú y tu día. Por ahora, esto confirma que el ingreso funciona.
        </p>

        {notice !== null && (
          <div className="mt-4">
            <Notice tone="ok">{notice}</Notice>
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="mt-6 h-11 rounded-control border border-line bg-surface px-4 font-semibold text-ink hover:bg-sunk disabled:cursor-wait"
        >
          {signingOut ? 'Saliendo…' : 'Salir'}
        </button>
      </section>
    </main>
  )
}

function readNotice(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }
  return null
}
