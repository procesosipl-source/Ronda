import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/authContext'
import { useInstitution } from '../features/institutions/institutionContext'
import { signOut } from '../features/institutions/signOut'
import { Icon } from '../features/navigation/icons'
import { groupSections, visibleSections, type MenuSection } from '../features/navigation/menu'
import { supabase } from '../lib/supabase'

/**
 * Estructura de la aplicación (docs/diseno.md, "Estructura de la aplicación").
 * Escritorio: menú lateral blanco en tres bloques. Celular (menos de 900 px): el menú pasa a una
 * barra horizontal desplazable arriba, sin títulos de bloque, y el contenido va en una columna.
 */
export function AppLayout() {
  const { current } = useInstitution()
  const blocks = groupSections(visibleSections(current.roles.map((role) => role.code), current.modules))

  return (
    <div className="min-h-screen desk:flex">
      <aside className="border-b border-line bg-surface desk:sticky desk:top-0 desk:flex desk:h-screen desk:w-[240px] desk:shrink-0 desk:flex-col desk:border-r desk:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 desk:block desk:px-5 desk:pt-5 desk:pb-4">
          <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="h-[22px] desk:h-[26px]" />
          <p className="truncate text-[0.84rem] font-semibold text-ink-2 desk:mt-3">{current.name}</p>
        </div>
        <nav aria-label="Menú principal" className="overflow-x-auto px-2 py-2 whitespace-nowrap desk:flex desk:whitespace-normal desk:flex-1 desk:flex-col desk:overflow-y-auto desk:px-3 desk:pt-0 desk:pb-4">
          {blocks.map((block) => (
            <div key={block.group} className={`contents desk:block ${block.group === 'footer' ? 'desk:mt-auto desk:border-t desk:border-line desk:pt-3' : ''} ${block.group === 'admin' ? 'desk:mt-4' : ''}`}>
              {block.title !== null && (
                <p className="hidden px-3 pb-1 text-[11px] font-semibold tracking-[.04em] text-ink-3 uppercase desk:block">{block.title}</p>
              )}
              <ul className="contents desk:flex desk:flex-col desk:gap-0.5">
                {block.sections.map((section) => (
                  <li key={section.key} className="inline-block desk:block">
                    <MenuItem section={section} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 desk:px-7 desk:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const itemBase =
  'flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-control px-3 text-[0.92rem] desk:border-l-[3px] desk:whitespace-normal'

function MenuItem({ section }: { section: MenuSection }) {
  const [showArrival, setShowArrival] = useState(false)

  // El aviso se cierra solo a los 5 segundos.
  useEffect(() => {
    if (!showArrival) return
    const timer = setTimeout(() => setShowArrival(false), 5000)
    return () => clearTimeout(timer)
  }, [showArrival])

  if (section.path !== undefined) {
    return (
      <NavLink
        to={section.path}
        end={section.path === '/'}
        className={({ isActive }) =>
          `${itemBase} ${
            isActive ? 'bg-primary-soft font-semibold text-primary desk:border-brand' : 'text-ink-2 hover:bg-sunk desk:border-transparent'
          }`
        }
      >
        <Icon name={section.icon} />
        {section.label}
      </NavLink>
    )
  }

  // Sección que todavía no existe: etiqueta "Próximamente" y, al tocarla, cuándo llega.
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowArrival((open) => !open)}
        aria-expanded={showArrival}
        className={`${itemBase} w-full text-left text-ink-3 hover:bg-sunk desk:border-transparent`}
      >
        <Icon name={section.icon} />
        <span className="desk:flex-1">{section.label}</span>
        <span className="hidden shrink-0 rounded-full border border-dashed border-line bg-sunk px-2 py-0.5 text-[0.7rem] desk:inline">
          Próximamente
        </span>
      </button>
      {showArrival && (
        // Escritorio: debajo del ítem. Celular: aviso breve abajo al centro (la barra se desplaza y lo cortaría).
        <p
          role="status"
          className="px-4 pb-2 text-[0.78rem] whitespace-normal text-ink-3 max-desk:fixed max-desk:bottom-4 max-desk:left-1/2 max-desk:z-20 max-desk:w-[min(90vw,320px)] max-desk:-translate-x-1/2 max-desk:rounded-control max-desk:bg-ink max-desk:px-4 max-desk:py-3 max-desk:text-white"
        >
          <span className="font-semibold">{section.label}: próximamente.</span> {section.arrives}
        </p>
      )}
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
    <header className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2.5 desk:px-7 desk:py-3">
      {all.length > 1 && (
        <label className="mr-auto flex items-center gap-2 text-[0.84rem] text-ink-3 desk:mr-0">
          <span className="hidden sm:inline">Institución</span>
          <select
            value={current.id}
            onChange={(event) => void switchTo(event.target.value)}
            aria-label="Institución"
            className="h-9 max-w-[200px] rounded-control border border-line bg-surface px-2 text-[0.88rem] text-ink"
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
