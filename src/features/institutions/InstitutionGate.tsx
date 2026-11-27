import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthLayout } from '../../components/AuthLayout'
import { Notice, primaryButtonClass } from '../../components/Notice'
import { supabase } from '../../lib/supabase'
import { LoadingScreen } from '../auth/RequireAuth'
import { useAuth } from '../auth/authContext'
import { InstitutionContext, type InstitutionContextValue } from './institutionContext'
import {
  groupMemberships,
  institutionStorageKey,
  parseStoredInstitution,
  serializeStoredInstitution,
  sessionIdFromToken,
  type MyInstitution,
} from './institutions'
import { signOut } from './signOut'

/**
 * Decide en qué institución trabaja la persona antes de mostrar la aplicación.
 * Con una sola institución entra directo; con varias, elige. Cada ingreso queda en la auditoría
 * (lo registra la función enter_institution en la base, que además verifica la membresía).
 */
export function InstitutionGate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const session = auth.status === 'signedIn' ? auth.session : null
  const userId = session?.user.id ?? null
  const sessionId = session === null ? null : sessionIdFromToken(session.access_token)

  const memberships = useQuery({
    queryKey: ['my-institutions', userId],
    enabled: userId !== null,
    queryFn: async (): Promise<MyInstitution[]> => {
      const { data, error } = await supabase
        .from('membership')
        .select('institution(id, name), role(code, name, sort_order)')
        .eq('user_id', userId ?? '')
        .is('deleted_at', null)
      if (error !== null) throw error
      // Módulos activos de esas instituciones, para armar el menú. RLS solo deja ver los de las propias.
      const modules = await supabase
        .from('institution_module')
        .select('institution_id, module(code)')
        .is('deactivated_at', null)
      if (modules.error !== null) throw modules.error
      return groupMemberships(data, modules.data)
    },
  })

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    parseStoredInstitution(localStorage.getItem(institutionStorageKey), sessionId),
  )
  const [entering, setEntering] = useState(false)
  const [denied, setDenied] = useState(false)

  const enter = useCallback(
    async (institutionId: string): Promise<boolean> => {
      if (sessionId === null) return false
      setEntering(true)
      setDenied(false)
      const { data, error } = await supabase.rpc('enter_institution', { p_institution_id: institutionId })
      setEntering(false)
      if (error !== null || data !== true) {
        setDenied(true)
        return false
      }
      localStorage.setItem(institutionStorageKey, serializeStoredInstitution(sessionId, institutionId))
      setSelectedId(institutionId)
      return true
    },
    [sessionId],
  )

  const all = memberships.data
  const current = all?.find((institution) => institution.id === selectedId) ?? null

  // Con una sola institución se entra directo. El ref evita registrar dos ingresos
  // cuando React monta el componente dos veces en desarrollo.
  const autoEntered = useRef(false)
  useEffect(() => {
    if (all?.length === 1 && current === null && !autoEntered.current) {
      autoEntered.current = true
      void enter(all[0]!.id)
    }
  }, [all, current, enter])

  const value = useMemo<InstitutionContextValue | null>(
    () => (current === null || all === undefined ? null : { current, all, switchTo: enter }),
    [current, all, enter],
  )

  if (memberships.isPending || entering) return <LoadingScreen />

  if (memberships.isError) {
    return (
      <AuthLayout title="No pudimos cargar tus instituciones">
        <Notice tone="danger">Revisá tu conexión y volvé a intentar.</Notice>
        <button type="button" onClick={() => void memberships.refetch()} className={`mt-4 w-full ${primaryButtonClass}`}>
          Volver a intentar
        </button>
      </AuthLayout>
    )
  }

  if (all === undefined || all.length === 0) {
    return (
      <AuthLayout title="Todavía no tenés acceso" description="Tu usuario no pertenece a ninguna institución.">
        <p className="text-ink-2">Pedile a la Dirección de tu institución que te invite.</p>
        <SignOutButton />
      </AuthLayout>
    )
  }

  if (value === null) {
    return (
      <AuthLayout title="¿Dónde vas a trabajar?" description="Elegí la institución. Después podés cambiarla desde arriba.">
        {denied && (
          <div className="mb-4">
            <Notice tone="danger">No pudiste entrar a esa institución. Si creés que es un error, hablá con su Dirección.</Notice>
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {all.map((institution) => (
            <li key={institution.id}>
              <button
                type="button"
                onClick={() => void enter(institution.id)}
                className="w-full rounded-control border border-line bg-surface px-4 py-3 text-left hover:border-primary hover:bg-primary-soft"
              >
                <span className="block font-semibold">{institution.name}</span>
                <span className="block text-[0.84rem] text-ink-3">{institution.roles.map((role) => role.name).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
        <SignOutButton />
      </AuthLayout>
    )
  }

  return <InstitutionContext value={value}>{children}</InstitutionContext>
}

function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut(null)}
      className="mt-6 h-11 w-full rounded-control border border-line bg-surface px-4 font-semibold text-ink hover:bg-sunk"
    >
      Salir
    </button>
  )
}
