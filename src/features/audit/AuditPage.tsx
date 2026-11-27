import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Notice } from '../../components/Notice'
import { formatDateTime } from '../../lib/dates'
import { supabase } from '../../lib/supabase'
import { useInstitution } from '../institutions/institutionContext'
import { roleNames } from './roleNames'

const pageSize = 50

/**
 * Auditoría de la institución activa (flujo 22). Solo la lee Dirección: lo garantiza RLS en la base.
 * Esta pantalla solo muestra lo que la base devuelve.
 */
export function AuditPage() {
  const { current } = useInstitution()
  const isDirector = current.roles.some((role) => role.code === 'director')

  if (!isDirector) {
    return (
      <section>
        <h1 className="text-[1.6rem] font-semibold">Auditoría</h1>
        <p className="mt-2 text-ink-2">Esta sección es solo para Dirección.</p>
      </section>
    )
  }

  return <AuditLog />
}

function AuditLog() {
  const { current } = useInstitution()
  const [actionId, setActionId] = useState<string>('')
  const [page, setPage] = useState(0)

  const actions = useQuery({
    queryKey: ['audit-actions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_action').select('id, name').order('name')
      if (error !== null) throw error
      return data
    },
  })

  const log = useQuery({
    queryKey: ['audit-log', current.id, actionId, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('id, occurred_at, user_name, role_codes, details, action:audit_action(code, name)', { count: 'exact' })
        .eq('institution_id', current.id)
        .order('occurred_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1)
      if (actionId !== '') query = query.eq('action_id', actionId)
      const { data, error, count } = await query
      if (error !== null) throw error
      return { rows: data, total: count ?? 0 }
    },
  })

  const total = log.data?.total ?? 0
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1)

  return (
    <section>
      <h1 className="text-[1.6rem] font-semibold">Auditoría</h1>
      <p className="mt-1 text-ink-2">Quién hizo qué y cuándo en {current.name}. Nadie puede modificar ni borrar estos registros.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[0.84rem] text-ink-3">
          Acción
          <select
            value={actionId}
            onChange={(event) => {
              setActionId(event.target.value)
              setPage(0)
            }}
            className="h-9 rounded-control border border-line bg-surface px-2 text-[0.88rem] text-ink"
          >
            <option value="">Todas</option>
            {actions.data?.map((action) => (
              <option key={action.id} value={action.id}>
                {action.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
        {log.isError ? (
          <div className="p-4">
            <Notice tone="danger">No pudimos cargar la auditoría. Revisá tu conexión y volvé a intentar.</Notice>
          </div>
        ) : log.isPending ? (
          <p role="status" className="p-4 text-ink-3">
            Cargando…
          </p>
        ) : log.data.rows.length === 0 ? (
          <p className="p-4 text-ink-2">
            {actionId === '' ? 'Todavía no hay registros. Cada ingreso a la institución va a aparecer acá.' : 'No hay registros de esa acción. Probá con "Todas".'}
          </p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-line text-[0.8rem] text-ink-3">
                <th className="px-4 py-2.5 font-semibold">Fecha y hora</th>
                <th className="px-4 py-2.5 font-semibold">Persona</th>
                <th className="px-4 py-2.5 font-semibold">Rol</th>
                <th className="px-4 py-2.5 font-semibold">Acción</th>
                <th className="px-4 py-2.5 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {log.data.rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-sunk">
                  <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{formatDateTime(row.occurred_at)}</td>
                  <td className="px-4 py-2.5">{row.user_name ?? 'Sistema'}</td>
                  <td className="px-4 py-2.5 text-ink-2">{roleNames(row.role_codes) || 'Sin rol en esta institución'}</td>
                  <td className={`px-4 py-2.5 ${row.action?.code === 'access_denied' ? 'font-semibold text-danger' : ''}`}>
                    {row.action?.name}
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{detailText(row.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="mt-3 flex items-center justify-end gap-3 text-[0.84rem] text-ink-3">
          <span>
            Página {page + 1} de {lastPage + 1}
          </span>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="h-9 rounded-control border border-line bg-surface px-3 font-semibold text-ink hover:bg-sunk disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 rounded-control border border-line bg-surface px-3 font-semibold text-ink hover:bg-sunk disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  )
}

function detailText(details: unknown): string {
  if (typeof details === 'object' && details !== null && 'reason' in details && typeof details.reason === 'string') {
    return details.reason
  }
  return ''
}
