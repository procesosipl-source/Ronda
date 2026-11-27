import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { useInstitution } from '../institutions/institutionContext'
import {
  deactivatePayer,
  listPayers,
  payerEditorRoles,
  payerKindLabel,
  payerKindLabels,
  payerKinds,
  payerSchema,
  savePayer,
  type Payer,
  type PayerValues,
} from './payers'

type Dialog = { kind: 'edit'; payer?: Payer } | { kind: 'deactivate'; payer: Payer } | null

/** Catálogo de obras sociales de la institución. Lo mantienen Dirección y Administración. */
export function PayersPage() {
  const { current } = useInstitution()
  const canEdit = current.roles.some((role) => payerEditorRoles.includes(role.code))
  const [dialog, setDialog] = useState<Dialog>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const payers = useQuery({ queryKey: ['payers', current.id], queryFn: () => listPayers(current.id) })

  const done = (message: string) => {
    setDialog(null)
    setNotice(message)
    void queryClient.invalidateQueries({ queryKey: ['payers', current.id] })
  }

  return (
    <section className="max-w-[860px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-semibold">Obras sociales</h1>
          <p className="mt-1 text-ink-2">Con quiénes trabaja {current.name}. Se eligen al cargar la cobertura de un paciente.</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setDialog({ kind: 'edit' })} className={`px-4 ${primaryButtonClass}`}>
            Agregar
          </button>
        )}
      </div>

      {notice !== null && (
        <div className="mt-4">
          <Notice tone="ok">{notice}</Notice>
        </div>
      )}

      <div className="mt-4 rounded-card border border-line bg-surface shadow-card">
        {payers.isError ? (
          <div className="p-4">
            <Notice tone="danger">{payers.error.message}</Notice>
          </div>
        ) : payers.isPending ? (
          <p role="status" className="p-4 text-ink-3">
            Cargando…
          </p>
        ) : (
          <ul>
            {payers.data.map((payer) => (
              <li key={payer.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
                <div className="min-w-[180px] flex-1">
                  <p className="font-semibold">{payer.name}</p>
                  <p className="text-[0.84rem] text-ink-3">
                    {payerKindLabel(payer.kind)}
                    {payer.kind !== 'private' && (payer.requires_member_number ? ' · Pide número de afiliado' : ' · Sin número de afiliado')}
                    {payer.national_code !== null && ` · RNOS ${payer.national_code}`}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setDialog({ kind: 'edit', payer })} className={tertiaryButtonClass}>
                      Editar
                    </button>
                    {payer.kind !== 'private' && (
                      <button type="button" onClick={() => setDialog({ kind: 'deactivate', payer })} className={tertiaryButtonClass}>
                        Dar de baja
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal title={dialog?.kind === 'edit' && dialog.payer ? 'Editar obra social' : 'Agregar obra social'} open={dialog?.kind === 'edit'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'edit' && <PayerForm payer={dialog.payer} onDone={done} />}
      </Modal>
      <Modal title="Dar de baja" open={dialog?.kind === 'deactivate'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'deactivate' && <DeactivateForm payer={dialog.payer} onDone={done} />}
      </Modal>
    </section>
  )
}

function PayerForm({ payer, onDone }: { payer?: Payer | undefined; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, control, formState } = useForm<PayerValues>({
    resolver: schemaResolver(payerSchema),
    defaultValues: {
      name: payer?.name ?? '',
      kind: (payer?.kind as PayerValues['kind'] | undefined) ?? 'social_security',
      requiresMemberNumber: payer?.requires_member_number ?? true,
      nationalCode: payer?.national_code ?? '',
    },
  })
  const kind = useWatch({ control, name: 'kind' })
  const mutation = useMutation({
    mutationFn: (values: PayerValues) => savePayer(current.id, values, payer?.id),
    onSuccess: (_d, values) => onDone(payer === undefined ? `Agregamos ${values.name.trim()}.` : `Guardamos los cambios de ${values.name.trim()}.`),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormField id="name" label="Nombre" error={errors.name?.message} inputProps={{ autoComplete: 'off', ...register('name') }} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kind" className="text-[0.84rem] font-semibold">
          Tipo
        </label>
        <select id="kind" {...register('kind')} className="h-11 rounded-control border border-line bg-surface px-3 text-ink">
          {payerKinds.map((k) => (
            <option key={k} value={k}>
              {payerKindLabels[k]}
            </option>
          ))}
        </select>
      </div>
      {kind !== 'private' && (
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" {...register('requiresMemberNumber')} className="size-4 accent-primary" />
          Pide número de afiliado
        </label>
      )}
      <div className="flex flex-col gap-1.5">
        <FormField id="nationalCode" label="Código RNOS (opcional)" inputProps={{ autoComplete: 'off', ...register('nationalCode') }} />
        <p className="text-[0.8rem] text-ink-3">El código de la Superintendencia de Servicios de Salud. Sirve para conectar con la obra social más adelante.</p>
      </div>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}

function DeactivateForm({ payer, onDone }: { payer: Payer; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const mutation = useMutation({
    mutationFn: () => deactivatePayer(current.id, payer.id),
    onSuccess: () => onDone(`Dimos de baja a ${payer.name}.`),
  })
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-2">
        <strong className="font-semibold text-ink">{payer.name}</strong> deja de aparecer para cargar coberturas nuevas. Los pacientes que ya la tienen no
        cambian, y su historial se conserva.
      </p>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Dando de baja…' : 'Dar de baja'}
      </button>
    </div>
  )
}
