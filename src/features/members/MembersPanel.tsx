import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { Notice, primaryButtonClass, tertiaryButtonClass } from '../../components/Notice'
import { schemaResolver } from '../../lib/formValidation'
import { roleLabels, roleNames } from '../audit/roleNames'
import { useInstitution } from '../institutions/institutionContext'
import { roleCodes } from '../navigation/menu'
import {
  changeRolesSchema,
  deactivateSchema,
  inviteSchema,
  type ChangeRolesValues,
  type DeactivateValues,
  type InviteValues,
} from './memberForms'
import { deactivateMember, inviteMember, listMembers, setMemberRoles, type Member } from './membersApi'

type Dialog = { kind: 'invite' } | { kind: 'roles'; member: Member } | { kind: 'deactivate'; member: Member } | null

/** Panel de Usuarios de Configuración (flujo 21). Solo para Dirección: la base lo garantiza. */
export function MembersPanel({ onDone }: { onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const [dialog, setDialog] = useState<Dialog>(null)
  const queryClient = useQueryClient()

  const members = useQuery({
    queryKey: ['members', current.id],
    queryFn: () => listMembers(current.id),
  })

  const finish = (message: string) => {
    setDialog(null)
    onDone(message)
    void queryClient.invalidateQueries({ queryKey: ['members', current.id] })
    // Si la persona cambió sus propios roles, el menú tiene que actualizarse.
    void queryClient.invalidateQueries({ queryKey: ['my-institutions'] })
  }

  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-[1.1rem] font-semibold">Usuarios</h2>
          <p className="text-[0.84rem] text-ink-3">Quién entra a {current.name} y con qué rol.</p>
        </div>
        <button type="button" onClick={() => setDialog({ kind: 'invite' })} className={`px-4 ${primaryButtonClass}`}>
          Invitar
        </button>
      </header>

      {members.isError ? (
        <div className="p-4">
          <Notice tone="danger">{members.error.message}</Notice>
        </div>
      ) : members.isPending ? (
        <p role="status" className="p-4 text-ink-3">
          Cargando…
        </p>
      ) : (
        <ul>
          {members.data.map((member) => (
            <li key={member.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 sm:px-5">
              <div className="min-w-[180px] flex-1">
                <p className="font-semibold">{member.full_name}</p>
                <p className="text-[0.84rem] break-all text-ink-3">{member.email}</p>
              </div>
              <div className="min-w-[140px] flex-1 text-[0.9rem] text-ink-2">
                {roleNames(member.role_codes)}
                {member.invitation_pending && (
                  <span className="ml-2 inline-block rounded-full bg-warn-soft px-2 py-0.5 text-[0.72rem] font-semibold text-warn">
                    Invitación pendiente
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setDialog({ kind: 'roles', member })} className={tertiaryButtonClass}>
                  Cambiar roles
                </button>
                <button type="button" onClick={() => setDialog({ kind: 'deactivate', member })} className={tertiaryButtonClass}>
                  Dar de baja
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal title="Invitar a una persona" open={dialog?.kind === 'invite'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'invite' && <InviteForm onDone={finish} />}
      </Modal>
      <Modal title="Cambiar roles" open={dialog?.kind === 'roles'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'roles' && <ChangeRolesForm member={dialog.member} onDone={finish} />}
      </Modal>
      <Modal title="Dar de baja" open={dialog?.kind === 'deactivate'} onClose={() => setDialog(null)}>
        {dialog?.kind === 'deactivate' && <DeactivateForm member={dialog.member} onDone={finish} />}
      </Modal>
    </section>
  )
}

function RoleCheckboxes({ register, error }: { register: ReturnType<typeof useForm<{ roleCodes: string[] }>>['register']; error?: string | undefined }) {
  return (
    <fieldset aria-describedby={error !== undefined ? 'roles-error' : undefined}>
      <legend className="text-[0.84rem] font-semibold">Roles</legend>
      <p className="text-[0.8rem] text-ink-3">Puede tener más de uno. Los permisos se suman.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {roleCodes.map((code) => (
          <label key={code} className="flex min-h-10 items-center gap-2 rounded-control border border-line px-3 has-checked:border-primary has-checked:bg-primary-soft">
            <input type="checkbox" value={code} {...register('roleCodes')} className="size-4 accent-primary" />
            {roleLabels[code]}
          </label>
        ))}
      </div>
      {error !== undefined && (
        <p id="roles-error" className="mt-1.5 text-[0.84rem] text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function ReasonField({ register, error, label }: { register: ReturnType<typeof useForm<{ reason: string }>>['register']; error?: string | undefined; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="reason" className="text-[0.84rem] font-semibold">
        {label}
      </label>
      <textarea
        id="reason"
        rows={3}
        {...register('reason')}
        aria-invalid={error !== undefined}
        aria-describedby={error !== undefined ? 'reason-error' : undefined}
        className={`rounded-control border bg-surface px-3 py-2 text-ink ${error !== undefined ? 'border-danger' : 'border-line'}`}
      />
      <p className="text-[0.8rem] text-ink-3">Queda guardado en la auditoría.</p>
      {error !== undefined && (
        <p id="reason-error" className="text-[0.84rem] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function InviteForm({ onDone }: { onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, formState } = useForm<InviteValues>({
    resolver: schemaResolver(inviteSchema),
    defaultValues: { fullName: '', email: '', roleCodes: [] },
  })
  const mutation = useMutation({
    mutationFn: (values: InviteValues) => inviteMember(current.id, values),
    onSuccess: (status, values) =>
      onDone(
        status === 'invited'
          ? `Le mandamos la invitación a ${values.email}.`
          : `${values.fullName} ya usaba Ronda: lo sumamos a ${current.name} sin mandar otro mail.`,
      ),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormField id="fullName" label="Nombre y apellido" error={errors.fullName?.message} inputProps={{ autoComplete: 'off', ...register('fullName') }} />
      <FormField id="email" label="Email" error={errors.email?.message} inputProps={{ type: 'email', autoComplete: 'off', ...register('email') }} />
      <RoleCheckboxes register={register as never} error={errors.roleCodes?.message} />
      <p className="text-[0.84rem] text-ink-3">Le va a llegar un mail para elegir su contraseña. Si ya usa Ronda en otra institución, se suma sin mail.</p>
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Invitando…' : 'Invitar'}
      </button>
    </form>
  )
}

function ChangeRolesForm({ member, onDone }: { member: Member; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, formState } = useForm<ChangeRolesValues>({
    resolver: schemaResolver(changeRolesSchema),
    defaultValues: { roleCodes: member.role_codes as ChangeRolesValues['roleCodes'], reason: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: ChangeRolesValues) => setMemberRoles(current.id, member.user_id, values),
    onSuccess: () => onDone(`Cambiamos los roles de ${member.full_name}.`),
  })
  const { errors } = formState

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <p className="text-ink-2">
        <strong className="font-semibold text-ink">{member.full_name}</strong> · {member.email}
      </p>
      <RoleCheckboxes register={register as never} error={errors.roleCodes?.message} />
      <ReasonField register={register as never} error={errors.reason?.message} label="Motivo del cambio" />
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Guardando…' : 'Guardar roles'}
      </button>
    </form>
  )
}

function DeactivateForm({ member, onDone }: { member: Member; onDone: (message: string) => void }) {
  const { current } = useInstitution()
  const { register, handleSubmit, formState } = useForm<DeactivateValues>({
    resolver: schemaResolver(deactivateSchema),
    defaultValues: { reason: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: DeactivateValues) => deactivateMember(current.id, member.user_id, values),
    onSuccess: () => onDone(`${member.full_name} ya no tiene acceso a ${current.name}.`),
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
      <p className="text-ink-2">
        <strong className="font-semibold text-ink">{member.full_name}</strong> deja de tener acceso a {current.name}. No se borra nada de lo que
        registró: sus evoluciones, turnos y registros siguen con su nombre.
      </p>
      <ReasonField register={register as never} error={formState.errors.reason?.message} label="Motivo de la baja" />
      {mutation.isError && <Notice tone="danger">{mutation.error.message}</Notice>}
      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Dando de baja…' : 'Dar de baja'}
      </button>
    </form>
  )
}
