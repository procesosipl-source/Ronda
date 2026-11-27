import { useLocation } from 'react-router'
import { Notice } from '../components/Notice'
import { useInstitution } from '../features/institutions/institutionContext'

/** Inicio provisorio. "Hoy" (el panel del día) llega con la agenda. */
export function HomePage() {
  const { current } = useInstitution()
  const location = useLocation()
  const notice = readNotice(location.state)

  return (
    <section className="max-w-[640px]">
      <h1 className="text-[1.6rem] font-semibold">Inicio</h1>
      <p className="mt-1 text-ink-2">
        Estás trabajando en <strong className="font-semibold text-ink">{current.name}</strong>.
      </p>

      {notice !== null && (
        <div className="mt-4">
          <Notice tone="ok">{notice}</Notice>
        </div>
      )}

      <div className="mt-6 rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="text-ink-2">
          El menú muestra las secciones de tu rol. Las que dicen <em>Próximamente</em> todavía no están disponibles:
          tocalas para ver cuándo llegan.
        </p>
      </div>
    </section>
  )
}

function readNotice(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }
  return null
}
