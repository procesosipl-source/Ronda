import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/authContext'
import { useInstitution } from '../features/institutions/institutionContext'
import { signOut } from '../features/institutions/signOut'
import { visibleSections, type MenuSection } from '../features/navigation/menu'
import { supabase } from '../lib/supabase'

/**
 * Estructura de la aplicación (docs/diseno.md, "Estructura de la aplicación"): menú lateral blanco
 * con las secciones del rol y barra superior con la persona, su rol y el selector de institución.
 * La versión para celular y los tres bloques del menú llegan en la semana 5.
 */
export function AppLayout() {
  const { current } = useInstitution()
  const sections = visibleSections(current.roles.map((role) => role.code))

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-surface md:min-h-screen md:w-[240px] md:shrink-0 md:border-r md:border-b-0">
        <div className="px-5 pt-5 pb-4">
          <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="h-[26px]" />
          <p className="mt-3 text-[0.84rem] font-semibold text-ink-2">{current.name}</p>
        </div>
        <nav aria-label="Menú principal" className="px-3 pb-5">
          <ul className="flex flex-col gap-0.5">
            {sections.map((section) => (
              <li key={section.key}>
                <MenuItem section={section} />
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 md:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MenuItem({ section }: { section: MenuSection }) {
  const [showArrival, setShowArrival] = useState(false)

  if (section.path !== undefined) {
    return (
      <NavLink
        to={section.path}
        end
        className={({ isActive }) =>
          `flex min-h-10 items-center rounded-control border-l-[3px] px-3 text-[0.92rem] ${
            isActive
              ? 'border-brand bg-primary-soft font-semibold text-primary'
              : 'border-transparent text-ink-2 hover:bg-sunk'
          }`
        }
      >
        {section.label}
      </NavLink>
    )
  }

  // Sección que todavía no existe: se muestra con la etiqueta "Próximamente" y, al tocarla, dice cuándo llega.
  return (
    <div>
      <button
        type="button"
        onClick={() => setShowArrival((open) => !open)}
        aria-expanded={showArrival}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-control border-l-[3px] border-transparent px-3 text-left text-[0.92rem] text-ink-3 hover:bg-sunk"
      >
        {section.label}
        <span className="shrink-0 rounded-full border border-dashed border-line bg-sunk px-2 py-0.5 text-[0.7rem] text-ink-3">
          Próximamente
        </span>
      </button>
      {showArrival && <p className="px-4 pb-2 text-[0.78rem] text-ink-3">{section.arrives}</p>}
    </div>
  )
}

function TopBar() {
  const auth = useAuth()
  const { current, all, switchTo } = useInstitution()
  const [signingOut, setSigningOut] = useState(false)
  const userId = auth.status === 'signedIn' ? auth.session.user.id : null

  const profile = useQuery({
    queryKey: ['my-profile', userId],
    enabled: userId !== null,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profile').select('full_name').eq('id', userId ?? '').single()
      if (error !== null) throw error
      return data
    },
  })

  const onSignOut = async () => {
    setSigningOut(true)
    await signOut(current.id)
  }

  return (
    <header className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 border-b border-line bg-surface px-4 py-3 md:px-7">
      {all.length > 1 && (
        <label className="flex items-center gap-2 text-[0.84rem] text-ink-3">
          Institución
          <select
            value={current.id}
            onChange={(event) => void switchTo(event.target.value)}
            className="h-9 rounded-control border border-line bg-surface px-2 text-[0.88rem] text-ink"
          >
            {all.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="text-right leading-tight">
        <p className="text-[0.9rem] font-semibold">{profile.data?.full_name ?? ' '}</p>
        <p className="text-[0.78rem] text-ink-3">{current.roles.map((role) => role.name).join(' · ')}</p>
      </div>
      <button
        type="button"
        onClick={() => void onSignOut()}
        disabled={signingOut}
        className="h-9 rounded-control border border-line bg-surface px-3 text-[0.88rem] font-semibold text-ink hover:bg-sunk disabled:cursor-wait"
      >
        {signingOut ? 'Saliendo…' : 'Salir'}
      </button>
    </header>
  )
}
