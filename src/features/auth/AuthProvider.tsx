import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext, type AuthState } from './authContext'

/** Sigue la sesión de Supabase y la comparte con toda la aplicación. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    // onAuthStateChange avisa la sesión inicial y cada cambio (ingreso, salida, enlace de recuperación).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session === null ? { status: 'signedOut' } : { status: 'signedIn', session })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}
