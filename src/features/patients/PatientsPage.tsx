import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Notice, primaryButtonClass } from '../../components/Notice'
import { useInstitution } from '../institutions/institutionContext'
import { patientCreatorRoles, patientReaderRoles, searchPatients } from './patientsApi'
import { ageOn, documentTypeLabel, listName, todayInMendoza } from './patientRules'

/** Pacientes: buscador y lista (flujo 01, "Recepción busca por DNI"). */
export function PatientsPage() {
  const { current } = useInstitution()
  const roles = current.roles.map((role) => role.code)
  const canRead = roles.some((role) => patientReaderRoles.includes(role))
  const canCreate = roles.some((role) => patientCreatorRoles.includes(role))

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.6rem] font-semibold">Pacientes</h1>
        {canCreate && (
          <Link to="/pacientes/nuevo" className={`inline-flex items-center px-4 ${primaryButtonClass}`}>
            Nuevo paciente
          </Link>
        )}
      </div>
      {canRead ? (
        <PatientList />
      ) : (
        <p className="mt-4 max-w-[560px] text-ink-2">
          Vas a ver a tus pacientes cuando te sumen a su equipo tratante. Si tenés que ver a alguien ahora, pedíselo a Coordinación.
        </p>
      )}
    </section>
  )
}

function PatientList() {
  const { current } = useInstitution()
  const [text, setText] = useState('')
  const query = useDebounced(text.trim(), 300)
  const today = todayInMendoza()

  const results = useQuery({
    queryKey: ['patients', current.id, query],
    placeholderData: keepPreviousData,
    queryFn: () => searchPatients(current.id, query),
  })

  return (
    <>
      <label htmlFor="patient-search" className="sr-only">
        Buscar paciente
      </label>
      <input
        id="patient-search"
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Buscar por apellido, nombre o documento"
        autoComplete="off"
        className="mt-4 h-11 w-full max-w-[560px] rounded-control border border-line bg-surface px-3 text-ink"
      />

      <div className="mt-4 rounded-card border border-line bg-surface shadow-card">
        {results.isError ? (
          <div className="p-4">
            <Notice tone="danger">{results.error.message}</Notice>
          </div>
        ) : results.isPending ? (
          <p role="status" className="p-4 text-ink-3">
            Cargando…
          </p>
        ) : results.data.length === 0 ? (
          <p className="p-4 text-ink-2">
            {query === '' ? 'Todavía no hay pacientes. Tocá "Nuevo paciente" para cargar el primero.' : `No encontramos a nadie con "${query}". Revisá cómo está escrito o buscá por documento.`}
          </p>
        ) : (
          <ul>
            {results.data.map((patient) => (
              <li key={patient.id} className="border-b border-line last:border-b-0">
                <Link to={`/pacientes/${patient.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-sunk sm:px-5">
                  <span className="min-w-[180px] flex-1 font-semibold">{listName(patient)}</span>
                  <span className="text-[0.88rem] text-ink-2 tabular-nums">
                    {documentTypeLabel(patient.document_type)} {patient.document_number}
                  </span>
                  <span className="w-16 text-[0.88rem] text-ink-2">{ageOn(patient.birth_date, today)} años</span>
                  <span className="rounded-full bg-sunk px-2.5 py-0.5 text-[0.75rem] font-semibold text-ink-2">{patient.status_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {results.data?.length === 50 && <p className="mt-2 text-[0.84rem] text-ink-3">Mostramos los primeros 50. Escribí más para achicar la búsqueda.</p>}
    </>
  )
}

/** Espera a que la persona deje de escribir antes de buscar. */
function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
