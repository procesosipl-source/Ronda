import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Notice, tertiaryButtonClass } from '../../components/Notice'
import { formatDateTime } from '../../lib/dates'
import { useInstitution } from '../institutions/institutionContext'
import { getPatient } from './patientsApi'
import { ageOn, displayName, documentTypeLabel, formatDate, todayInMendoza } from './patientRules'

/** Ficha mínima del paciente. La ficha completa (estados, referentes, edición) llega en la semana 7. */
export function PatientPage() {
  const { current } = useInstitution()
  const { patientId = '' } = useParams()
  const location = useLocation()
  const notice = readNotice(location.state)

  const patient = useQuery({
    queryKey: ['patient', current.id, patientId],
    queryFn: () => getPatient(current.id, patientId),
  })

  return (
    <section className="max-w-[720px]">
      <Link to="/pacientes" className={`-ml-3 ${tertiaryButtonClass}`}>
        ← Pacientes
      </Link>
      {patient.isError ? (
        <div className="mt-4">
          <Notice tone="danger">{patient.error.message}</Notice>
        </div>
      ) : patient.isPending ? (
        <p role="status" className="mt-4 text-ink-3">
          Cargando…
        </p>
      ) : patient.data === null ? (
        <p className="mt-4 text-ink-2">No encontramos este paciente, o no tenés permiso para verlo.</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[1.6rem] font-semibold">{displayName(patient.data)}</h1>
            <span className="rounded-full bg-sunk px-2.5 py-0.5 text-[0.8rem] font-semibold text-ink-2">{patient.data.status?.name}</span>
          </div>
          {notice !== null && (
            <div className="mt-3">
              <Notice tone="ok">{notice}</Notice>
            </div>
          )}
          <dl className="mt-5 grid gap-x-6 gap-y-4 rounded-card border border-line bg-surface p-5 shadow-card sm:grid-cols-2">
            {patient.data.chosen_name !== null && <Item label="Nombre en el documento">{patient.data.first_name}</Item>}
            <Item label="Documento">
              {documentTypeLabel(patient.data.document_type)} {patient.data.document_number}
            </Item>
            <Item label="Fecha de nacimiento">
              {formatDate(patient.data.birth_date)} ({ageOn(patient.data.birth_date, todayInMendoza())} años)
            </Item>
            <Item label="Sexo registral">{patient.data.registered_sex ?? 'Sin cargar'}</Item>
            <Item label="Teléfono">{patient.data.phone ?? 'Sin cargar'}</Item>
            <Item label="Email">{patient.data.email ?? 'Sin cargar'}</Item>
            <Item label="Cargado el">{formatDateTime(patient.data.created_at)}</Item>
          </dl>
          <p className="mt-4 text-[0.88rem] text-ink-3">Editar los datos, cambiar el estado y cargar referentes llega en la semana 7.</p>
        </>
      )}
    </section>
  )
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.8rem] text-ink-3">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  )
}

function readNotice(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }
  return null
}
