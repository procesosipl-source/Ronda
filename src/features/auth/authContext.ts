import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session }

export const AuthContext = createContext<AuthState>({ status: 'loading' })

/** Dice si hay alguien adentro. Qué puede ver cada persona lo decide RLS en la base. */
export function useAuth(): AuthState {
  return useContext(AuthContext)
}
