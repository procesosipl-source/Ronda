import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Notice } from '../../components/Notice'
import { supabase } from '../../lib/supabase'
import { useInstitution } from '../institutions/institutionContext'
import { MembersPanel } from '../members/MembersPanel'

/** Configuración de la institución. Solo Dirección (la base lo garantiza; acá solo se refleja). */
export function SettingsPage() {
  const { current } = useInstitution()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (toast === null) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  if (!current.roles.some((role) => role.code === 'director')) {
    return (
      <section>
        <h1 className="text-[1.6rem] font-semibold">Configuración</h1>
        <p className="mt-2 text-ink-2">Esta sección es solo para Dirección.</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[1.6rem] font-semibold">Configuración</h1>
        <p className="mt-1 text-ink-2">{current.name}</p>
      </div>
      <MembersPanel onDone={setToast} />
      <ModulesPanel />
      {toast !== null && (
        <p role="status" className="fixed bottom-4 left-1/2 z-30 w-[min(90vw,420px)] -translate-x-1/2 rounded-control bg-ink px-4 py-3 text-white">
          {toast}
        </p>
      )}
    </section>
  )
}

/** Módulos de la institución (ADR 0003). Solo lectura: los cambia IPL. */
function ModulesPanel() {
  const { current } = useInstitution()
  const modules = useQuery({
    queryKey: ['modules-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('module').select('code, name, description').order('sort_order')
      if (error !== null) throw error
      return data
    },
  })

  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <header className="border-b border-line px-4 py-3.5 sm:px-5">
        <h2 className="text-[1.1rem] font-semibold">Módulos</h2>
        <p className="text-[0.84rem] text-ink-3">Para sumar o quitar un módulo, hablá con IPL.</p>
      </header>
      {modules.isError ? (
        <div className="p-4">
          <Notice tone="danger">No pudimos cargar los módulos. Revisá tu conexión y volvé a intentar.</Notice>
        </div>
      ) : modules.isPending ? (
        <p role="status" className="p-4 text-ink-3">
          Cargando…
        </p>
      ) : (
        <ul>
          {modules.data.map((module) => {
            const active = module.code === 'core' || current.modules.includes(module.code)
            return (
              <li key={module.code} className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
                <div>
                  <p className="font-semibold">{module.name}</p>
                  <p className="text-[0.84rem] text-ink-3">{module.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${active ? 'bg-ok-soft text-ok' : 'bg-sunk text-ink-3'}`}
                >
                  {active ? 'Activo' : 'No contratado'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
