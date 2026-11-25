import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './authContext'

/** Muestra su contenido solo con sesión iniciada; si no, lleva a la pantalla de ingreso. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <LoadingScreen />
  if (auth.status === 'signedOut') {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />
  }
  return children
}

export function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p role="status" className="text-ink-3">
        Cargando…
      </p>
    </main>
  )
}
