import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useParams } from 'react-router'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { formatDateTime } from '../../lib/dates'
import { schemaResolver } from '../../lib/formValidation'
import { useInstitution } from '../institutions/institutionContext'
import {
  contactDataSchema,
  patientContactSchema,
  personalDataSchema,
  statusChangeSchema,
  type ContactDataValues,
  type PatientContactValues,
  type PersonalDataValues,
  type StatusChangeValues,
} from './patientForms'
import {
  allowedNextStatuses,
  changePatientStatus,
  getPatient,
  getStatusHistory,
  listContacts,
  patientCreatorRoles,
  patientStatusRoles,
  removeContact,
  saveContact,
  updatePatient,
  type Patient,
  type PatientContact,
} from './patientsApi'
import {
  ageOn,
  displayName,
  documentTypeLabel,
  documentTypeLabels,
  documentTypes,
  formatDate,
  relationshipLabel,
  relationshipLabels,
  relationships,
  todayInMendoza,
} from './patientRules'

type Dialog =
  | { kind: 'status' }
  | { kind: 'personal' }
  | { kind: 'contactData' }
  | { kind: 'contact'; contact?: PatientContact }
  | { kind: 'removeContact'; contact: PatientContact }
  | null

const selectClass = 'h-11 w-full rounded-control border border-line bg-surface px-3 text-ink'
const secondaryButtonClass = 'h-9 rounded-control border border-line bg-surface px-3 text-[0.88rem] font-semibold text-ink hover:bg-sunk'

/** Ficha del paciente (flujos 01 y 02). Cada panel editable tiene su modal (docs/diseno.md). */
export function PatientPage() {
  const { current } = useInstitution()
  const { patientId = '' } = useParams()
  const location = useLocation()
  const [notice, setNotice] = useState<string | null>(() => readNotice(location.state))
  const [dialog, setDialog] = useState<Dialog>(null)
  const queryClient = useQueryClient()

  const roles = current.roles.map((role) => role.code)
  const canEdit = roles.some((role) => patientCreatorRoles.includes(role))
  const canChangeStatus = roles.some((role) => patientStatusRoles.includes(role))

  const patient = useQuery({
    queryKey: ['patient', current.id, patientId],
    queryFn: () => getPatient(current.id, patientId),
  })

  const done = (message: string) => {
    setDialog(null)
    setNotice(message)
    void queryClient.invalidateQueries({ queryKey: ['patient', current.id, patientId] })
    void queryClient.invalidateQueries({ queryKey: ['patient-history', current.id, patientId] })
    void queryClient.invalidateQueries({ queryKey: ['patient-contacts', current.id, patientId] })
    void queryClient.invalidateQueries({ queryKey: ['patients', current.id] })
  }

  if (patient.isError) return <Shell><Notice tone="danger">{patient.error.message}</Notice></Shell>
  if (patient.isPending) return <Shell><p role="status" className="text-ink-3">Cargando…</p></Shell>
  if (patient.data === null) return <Shell><p className="text-ink-2">No encontramos este paciente, o no tenés permiso para verlo.</p></Shell>
  const p = patient.data

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[1.6rem] font-semibold">{displayName(p)}</h1>
        <span className="rounded-full bg-sunk px-2.5 py-0.5 text-[0.8rem] font-semibold text-ink-2">{p.status?.name}</span>
        {canChangeStatus && (
          <button type="button" onClick={() => setDialog({ kind: 'status' })} className={secondaryButtonClass}>
            Cambiar estado
          </button>
        )}
      </div>
      <p className="mt-1 text-ink-2">
        {documentTypeLabel(p.document_type)} {p.document_number} · {ageOn(p.birth_date, todayInMendoza())} años
      </p>

      {notice !== null && (
        <div className="mt-3">
          <Notice tone="ok">{notice}</Notice>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Datos personales" onEdit={canEdit ? () => setDialog({ kind: 'personal' }) : undefined}>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Item label="Nombre en el documento">{p.first_name}</Item>
            <Item label="Apellido">{p.last_name}</Item>
            <Item label="Nombre elegido">{p.chosen_name ?? 'Sin cargar'}</Item>
            <Item label="Documento">
              {documentTypeLabel(p.document_type)} {p.document_number}
            </Item>
            <Item label="Fecha de nacimiento">{formatDate(p.birth_date)}</Item>
            <Item label="Sexo registral">{p.registered_sex ?? 'Sin cargar'}</Item>
          </dl>
        </Panel>

        <Panel title="Contacto y domicilio" onEdit={canEdit ? () => setDialog({ kind: 'contactData' }) : undefined}>
          <dl className="grid gap-y-3">
            <Item label="Teléfono">{p.phone ?? 'Sin cargar'}</Item>
            <Item label="Email">{p.email ?? 'Sin cargar'}</Item>
            <Item label="Domicilio">{p.address ?? 'Sin cargar'}</Item>
          </dl>
        </Panel>

        <ContactsPanel
          patientId={p.id}
          canEdit={canEdit}
          onAdd={() => setDialog({ kind: 'contact' })}
          onEdit={(contact) => setDialog({ kind: 'contact', contact })}
          onRemove={(contact) => setDialog({ kind: 'removeContact', contact })}
        />

        <HistoryPanel patientId={p.id} />
      </div>

      <Modal title="Cambiar estado" open={dialog?.kind === 'status'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'status' && <StatusForm patient={p} onDone={done} />}
      </Modal>
      <Modal title="Datos personales" open={dialog?.kind === 'personal'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'personal' && <PersonalDataForm patient={p} onDone={done} />}
      </Modal>
      <Modal title="Contacto y domicilio" open={dialog?.kind === 'contactData'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'contactData' && <ContactDataForm patient={p} onDone={done} />}
      </Modal>
      <Modal title={dialog?.kind === 'contact' && dialog.contact ? 'Editar referente' : 'Agregar referente'} open={dialog?.kind === 'contact'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'contact' && <ContactForm patientId={p.id} contact={dialog.contact} onDone={done} />}
      </Modal>
      <Modal title="Quitar referente" open={dialog?.kind === 'removeContact'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'removeContact' && <RemoveContactForm contact={dialog.contact} onDone={done} />}
      </Modal>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="max-w-[1100px]">
      <Link to="/pacientes" className={`-ml-3 ${tertiaryButtonClass}`}>
        ← Pacientes
      </Link>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Panel({ title, onEdit, action, children }: { title: string; onEdit?: (() => void) | undefined; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="text-[1.05rem] font-semibold">{title}</h2>
        {onEdit !== undefined && (
          <button type="button" onClick={onEdit} className={secondaryButtonClass}>
            Editar
          </button>
        )}
        {action}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
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

// ---------------------------------------------------------------------------
// Referentes
// ---------------------------------------------------------------------------

function ContactsPanel(props: {
  patientId: string
  canEdit: boolean
  onAdd: () => void
  onEdit: (contact: PatientContact) => void
  onRemove: (contact: PatientContact) => void
}) {
  const { current } = useInstitution()
  const contacts = useQuery({
    queryKey: ['patient-contacts', current.id, props.patientId],
    queryFn: () => listContacts(current.id, props.patientId),
  })

  return (
    <Panel
      title="Referentes"
      action={
        props.canEdit ? (
          <button type="button" onClick={props.onAdd} className={secondaryButtonClass}>
            Agregar
          </button>
        ) : undefined
      }
    >
      {contacts.isError ? (
        <Notice tone="danger">{contacts.error.message}</Notice>
      ) : contacts.isPending ? (
        <p role="status" className="text-ink-3">
          Cargando…
        </p>
      ) : contacts.data.length === 0 ? (
        <p className="text-ink-2">Todavía no hay referentes. Cargá al menos un familiar o contacto responsable.</p>
      ) : (
        <ul className="-my-2">
          {contacts.data.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2.5 last:border-b-0">
              <div className="min-w-[160px] flex-1">
                <p className="font-semibold">
                  {contact.full_name}
                  {contact.is_primary && (
                    <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[0.72rem] font-semibold text-primary">Principal</span>
                  )}
                </p>
                <p className="text-[0.86rem] text-ink-2">
                  {relationshipLabel(contact.relationship)} ·{' '}
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-primary underline">
                    {contact.phone}
                  </a>
                </p>
              </div>
              {props.canEdit && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => props.onEdit(contact)} className={tertiaryButtonClass}>
                    Editar
                  </button>
                  <button type="button" onClick={() => props.onRemove(contact)} className={tertiaryButtonClass}>
                    Quitar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function ContactForm({ patientId, contact, onDone }: { patientId: string; contact?: PatientContact | undefined; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, formState } = useForm<PatientContactValues>({
    resolver: schemaResolver(patientContactSchema),
    defaultValues: {
      fullName: contact?.full_name ?? '',
      relationship: (contact?.relationship as PatientContactValues['relationship'] | undefined) ?? 'mother',
      phone: contact?.phone ?? '',
      isPrimary: contact?.is_primary ?? false,
    },
  })
  const mutation = useMutation({
    mutationFn: (values: PatientContactValues) => saveContact(current.id, patientId, values, contact?.id),
    onSuccess: () => onDone(contact === undefined ? 'Agregamos el referente.' : 'Guardamos los cambios del referente.'),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormField id="fullName" label="Nombre y apellido" error={errors.fullName?.message} inputProps={{ autoComplete: 'off', ...register('fullName') }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="relationship" className="text-[0.84rem] font-semibold">
            Parentesco
          </label>
          <select id="relationship" {...register('relationship')} className={selectClass}>
            {relationships.map((r) => (
              <option key={r} value={r}>
                {relationshipLabels[r]}
              </option>
            ))}
          </select>
        </div>
        <FormField id="phone" label="Teléfono" error={errors.phone?.message} inputProps={{ type: 'tel', autoComplete: 'off', ...register('phone') }} />
      </div>
      <label className="flex min-h-10 items-center gap-2">
        <input type="checkbox" {...register('isPrimary')} className="size-4 accent-primary" />
        Es el contacto principal
      </label>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

function RemoveContactForm({ contact, onDone }: { contact: PatientContact; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const mutation = useMutation({
    mutationFn: () => removeContact(current.id, contact.id),
    onSuccess: () => onDone(`Quitamos a ${contact.full_name} de los referentes.`),
  })
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-2">
        ¿Quitar a <strong className="font-semibold text-ink">{contact.full_name}</strong> de los referentes? Queda guardado en el sistema, pero deja de
        aparecer en la ficha.
      </p>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Quitando…' : 'Quitar referente'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Historial de estados
// ---------------------------------------------------------------------------

function HistoryPanel({ patientId }: { patientId: string }) {
  const { current } = useInstitution()
  const history = useQuery({
    queryKey: ['patient-history', current.id, patientId],
    queryFn: () => getStatusHistory(current.id, patientId),
  })

  return (
    <Panel title="Historial de estados">
      {history.isError ? (
        <Notice tone="danger">{history.error.message}</Notice>
      ) : history.isPending ? (
        <p role="status" className="text-ink-3">
          Cargando…
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {history.data.map((entry) => (
            <li key={entry.id} className="border-l-[3px] border-line pl-3">
              <p className="font-semibold">
                {entry.from_status === null ? entry.to_status?.name : `${entry.from_status.name} → ${entry.to_status?.name}`}
              </p>
              <p className="text-[0.86rem] text-ink-2">{entry.reason}</p>
              <p className="text-[0.8rem] text-ink-3">
                {formatDateTime(entry.changed_at)} · {entry.changer?.full_name ?? 'Sistema'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Formularios de los paneles
// ---------------------------------------------------------------------------

function StatusForm({ patient, onDone }: { patient: Patient; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const next = useQuery({
    queryKey: ['next-statuses', current.id, patient.status_id],
    queryFn: () => allowedNextStatuses(current.id, patient.status_id),
  })
  const { register, handleSubmit, formState } = useForm<StatusChangeValues>({
    resolver: schemaResolver(statusChangeSchema),
    defaultValues: { toStatusId: '', reason: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: StatusChangeValues) => changePatientStatus(current.id, patient.id, values),
    onSuccess: (_data, values) => onDone(`Listo, ${displayName(patient)} pasó a ${next.data?.find((s) => s.id === values.toStatusId)?.name ?? 'su nuevo estado'}.`),
  })
  const { errors } = formState

  if (next.isPending) return <p role="status" className="text-ink-3">Cargando…</p>
  if (next.isError) return <Notice tone="danger">{next.error.message}</Notice>
  if (next.data.length === 0) {
    return <p className="text-ink-2">Desde {patient.status?.name} no se puede pasar a otro estado en esta institución.</p>
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <p className="text-ink-2">
        {displayName(patient)} está en <strong className="font-semibold text-ink">{patient.status?.name}</strong>.
      </p>
      <fieldset aria-describedby={errors.toStatusId ? 'status-error' : undefined}>
        <legend className="text-[0.84rem] font-semibold">Nuevo estado</legend>
        <div className="mt-2 flex flex-col gap-2">
          {next.data.map((status) => (
            <label key={status.id} className="flex min-h-10 items-center gap-2 rounded-control border border-line px-3 has-checked:border-primary has-checked:bg-primary-soft">
              <input type="radio" value={status.id} {...register('toStatusId')} className="size-4 accent-primary" />
              {status.name}
            </label>
          ))}
        </div>
        {errors.toStatusId && (
          <p id="status-error" className="mt-1.5 text-[0.84rem] text-danger">
            {errors.toStatusId.message}
          </p>
        )}
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="text-[0.84rem] font-semibold">
          Motivo
        </label>
        <textarea
          id="reason"
          rows={3}
          {...register('reason')}
          aria-invalid={errors.reason !== undefined}
          className={`rounded-control border bg-surface px-3 py-2 text-ink ${errors.reason ? 'border-danger' : 'border-line'}`}
        />
        <p className="text-[0.8rem] text-ink-3">Queda en el historial y en la auditoría.</p>
        {errors.reason && <p className="text-[0.84rem] text-danger">{errors.reason.message}</p>}
      </div>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Cambiar estado'}
      </button>
    </form>
  )
}

function PersonalDataForm({ patient, onDone }: { patient: Patient; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const today = todayInMendoza()
  const { register, handleSubmit, formState } = useForm<PersonalDataValues>({
    resolver: schemaResolver(personalDataSchema(today)),
    defaultValues: {
      firstName: patient.first_name,
      lastName: patient.last_name,
      chosenName: patient.chosen_name ?? '',
      documentType: patient.document_type as PersonalDataValues['documentType'],
      documentNumber: patient.document_number,
      birthDate: patient.birth_date,
      registeredSex: (patient.registered_sex ?? '') as PersonalDataValues['registeredSex'],
    },
  })
  const mutation = useMutation({
    mutationFn: (values: PersonalDataValues) => updatePatient(current.id, patient, values),
    onSuccess: () => onDone('Guardamos los datos personales.'),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="firstName" label="Nombre (como figura en el documento)" error={errors.firstName?.message} inputProps={{ autoComplete: 'off', ...register('firstName') }} />
        <FormField id="lastName" label="Apellido" error={errors.lastName?.message} inputProps={{ autoComplete: 'off', ...register('lastName') }} />
      </div>
      <FormField id="chosenName" label="Nombre elegido (opcional)" inputProps={{ autoComplete: 'off', ...register('chosenName') }} />
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="documentType" className="text-[0.84rem] font-semibold">
            Tipo de documento
          </label>
          <select id="documentType" {...register('documentType')} className={selectClass}>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {documentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <FormField id="documentNumber" label="Número" error={errors.documentNumber?.message} inputProps={{ autoComplete: 'off', ...register('documentNumber') }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="birthDate" label="Fecha de nacimiento" error={errors.birthDate?.message} inputProps={{ type: 'date', max: today, ...register('birthDate') }} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="registeredSex" className="text-[0.84rem] font-semibold">
            Sexo registral (opcional)
          </label>
          <select id="registeredSex" {...register('registeredSex')} className={selectClass}>
            <option value="">Sin cargar</option>
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="X">X</option>
          </select>
        </div>
      </div>
      <p className="text-[0.8rem] text-ink-3">Los cambios quedan en la auditoría, con el dato anterior y el nuevo.</p>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

function ContactDataForm({ patient, onDone }: { patient: Patient; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, formState } = useForm<ContactDataValues>({
    resolver: schemaResolver(contactDataSchema),
    defaultValues: { phone: patient.phone ?? '', email: patient.email ?? '', address: patient.address ?? '' },
  })
  const mutation = useMutation({
    mutationFn: (values: ContactDataValues) => updatePatient(current.id, patient, values),
    onSuccess: () => onDone('Guardamos el contacto y el domicilio.'),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormField id="phone" label="Teléfono" inputProps={{ type: 'tel', autoComplete: 'off', ...register('phone') }} />
      <FormField id="email" label="Email" error={errors.email?.message} inputProps={{ type: 'email', autoComplete: 'off', ...register('email') }} />
      <FormField id="address" label="Domicilio" inputProps={{ autoComplete: 'off', ...register('address') }} />
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

function readNotice(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
    return state.notice
  }
  return null
}
