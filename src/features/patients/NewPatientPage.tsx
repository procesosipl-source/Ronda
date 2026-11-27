import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { FormField } from '../../components/FormField'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { useInstitution } from '../institutions/institutionContext'
import { listPayers, payerKindLabel } from '../payers/payers'
import { emptyNewPatient, newPatientSchema, type NewPatientValues } from './patientForms'
import { createPatient, findByDocument, patientCreatorRoles } from './patientsApi'
import { displayName, documentTypeLabels, documentTypes, normalizeDocument, todayInMendoza } from './patientRules'

const selectClass = 'h-11 w-full rounded-control border border-line bg-surface px-3 text-ink'

/** Alta de paciente (flujo 01). Formulario largo: va en pantalla completa (docs/diseno.md). */
export function NewPatientPage() {
  const { current } = useInstitution()
  const canCreate = current.roles.some((role) => patientCreatorRoles.includes(role.code))
  if (!canCreate) {
    return (
      <section>
        <h1 className="text-[1.6rem] font-semibold">Nuevo paciente</h1>
        <p className="mt-2 text-ink-2">Dar de alta pacientes es tarea de Recepción, Administración o Dirección.</p>
      </section>
    )
  }
  return <NewPatientForm />
}

function NewPatientForm() {
  const { current } = useInstitution()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = todayInMendoza()
  const payers = useQuery({ queryKey: ['payers', current.id], queryFn: () => listPayers(current.id) })
  const requiring = (payers.data ?? []).filter((p) => p.requires_member_number).map((p) => p.id)
  const { register, handleSubmit, control, formState } = useForm<NewPatientValues>({
    resolver: schemaResolver(newPatientSchema(today, requiring)),
    defaultValues: emptyNewPatient,
  })
  const payerId = useWatch({ control, name: 'payerId' })
  const selectedPayer = payers.data?.find((p) => p.id === payerId)
  const { errors } = formState

  // Flujo 01: antes de cargar, se busca por documento. Si ya existe, se abre la ficha y no se duplica.
  const documentType = useWatch({ control, name: 'documentType' })
  const documentNumber = normalizeDocument(useWatch({ control, name: 'documentNumber' }))
  const existing = useQuery({
    queryKey: ['patient-by-document', current.id, documentType, documentNumber],
    enabled: documentNumber.length >= 6,
    queryFn: () => findByDocument(current.id, documentType, documentNumber),
  })

  const mutation = useMutation({
    mutationFn: (values: NewPatientValues) => createPatient(current.id, values),
    onSuccess: async (patientId) => {
      await queryClient.invalidateQueries({ queryKey: ['patients', current.id] })
      await navigate(`/pacientes/${patientId}`, { state: { notice: 'Listo, el paciente quedó cargado en Preadmisión.' } })
    },
  })

  return (
    <section className="max-w-[640px]">
      <Link to="/pacientes" className={`-ml-3 ${tertiaryButtonClass}`}>
        ← Pacientes
      </Link>
      <h1 className="mt-2 text-[1.6rem] font-semibold">Nuevo paciente</h1>
      <p className="mt-1 text-ink-2">Lo demás (domicilio, referentes) se completa en la admisión.</p>

      <form className="mt-5 flex flex-col gap-5" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <legend className="sr-only">Documento</legend>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
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
            <FormField
              id="documentNumber"
              label="Número"
              error={errors.documentNumber?.message}
              inputProps={{ inputMode: documentType === 'dni' ? 'numeric' : 'text', autoComplete: 'off', ...register('documentNumber') }}
            />
          </div>
          {existing.data != null && (
            <Notice tone="warn">
              Ya hay un paciente con ese documento: <strong className="font-semibold">{displayName(existing.data)}</strong>.{' '}
              <Link to={`/pacientes/${existing.data.id}`} className="font-semibold underline">
                Abrir su ficha
              </Link>
            </Notice>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <legend className="sr-only">Datos personales</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="firstName" label="Nombre (como figura en el documento)" error={errors.firstName?.message} inputProps={{ autoComplete: 'off', ...register('firstName') }} />
            <FormField id="lastName" label="Apellido" error={errors.lastName?.message} inputProps={{ autoComplete: 'off', ...register('lastName') }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormField id="chosenName" label="Nombre elegido (opcional)" inputProps={{ autoComplete: 'off', ...register('chosenName') }} />
            <p className="text-[0.8rem] text-ink-3">Si la persona pide que la llamen de otra forma (Ley 26.743). Ronda lo usa en todas las pantallas.</p>
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
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <legend className="sr-only">Cobertura</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="payerId" className="text-[0.84rem] font-semibold">
                Obra social
              </label>
              <select
                id="payerId"
                {...register('payerId')}
                aria-invalid={errors.payerId !== undefined}
                className={`${selectClass} ${errors.payerId ? 'border-danger' : ''}`}
              >
                <option value="">{payers.isPending ? 'Cargando…' : 'Elegí una'}</option>
                {payers.data?.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.name} ({payerKindLabel(payer.kind)})
                  </option>
                ))}
              </select>
              {errors.payerId && <p className="text-[0.84rem] text-danger">{errors.payerId.message}</p>}
            </div>
            {selectedPayer?.requires_member_number === true && (
              <FormField id="memberNumber" label="Número de afiliado" error={errors.memberNumber?.message} inputProps={{ autoComplete: 'off', ...register('memberNumber') }} />
            )}
          </div>
          {payers.isError && <Notice tone="danger">{payers.error.message}</Notice>}
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <legend className="sr-only">Contacto</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="phone" label="Teléfono (opcional)" inputProps={{ type: 'tel', autoComplete: 'off', ...register('phone') }} />
            <FormField id="email" label="Email (opcional)" error={errors.email?.message} inputProps={{ type: 'email', autoComplete: 'off', ...register('email') }} />
          </div>
        </fieldset>

        {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}

        <button type="submit" disabled={mutation.isPending || existing.data != null} className={`px-6 sm:self-start ${primaryButtonClass}`}>
          {mutation.isPending ? 'Guardando…' : 'Guardar paciente'}
        </button>
      </form>
    </section>
  )
}
