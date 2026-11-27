import { FunctionsHttpError, type PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { ChangeRolesValues, DeactivateValues, InviteValues } from './memberForms'

/**
 * Llamadas de la pantalla de Usuarios. Cada una va a una función del servidor que verifica
 * el permiso, aplica el cambio y lo registra en la auditoría (flujo 21).
 */

export interface Member {
  user_id: string
  full_name: string
  email: string
  role_codes: string[]
  invitation_pending: boolean
}

/** Error con un mensaje escrito para la persona. */
export class MemberActionError extends Error {}

const noPermission = 'No tenés permiso para hacer esto en esta institución.'
const genericError = 'No pudimos guardar el cambio. Revisá tu conexión y volvé a intentar.'

/** Los errores P0001 son los mensajes que escribimos en la base para la persona. */
function fromDatabase(error: PostgrestError): MemberActionError {
  return new MemberActionError(error.code === 'P0001' ? error.message : genericError)
}

export async function listMembers(institutionId: string): Promise<Member[]> {
  const { data, error } = await supabase.rpc('list_members', { p_institution_id: institutionId })
  if (error !== null) throw fromDatabase(error)
  return data
}

/** Devuelve 'invited' si se mandó el mail, o 'added' si la persona ya usaba Ronda. */
export async function inviteMember(institutionId: string, values: InviteValues): Promise<'invited' | 'added'> {
  const { data, error } = await supabase.functions.invoke<{ status: 'invited' | 'added' }>('invite-user', {
    body: { institutionId, email: values.email, fullName: values.fullName, roleCodes: values.roleCodes },
  })
  if (error !== null) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await (error.context as Response).json().catch(() => null)
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
        throw new MemberActionError(body.error)
      }
    }
    throw new MemberActionError('No pudimos mandar la invitación. Revisá tu conexión y volvé a intentar.')
  }
  return data?.status ?? 'invited'
}

export async function setMemberRoles(institutionId: string, userId: string, values: ChangeRolesValues): Promise<void> {
  const { data, error } = await supabase.rpc('set_member_roles', {
    p_institution_id: institutionId,
    p_user_id: userId,
    p_role_codes: values.roleCodes,
    p_reason: values.reason,
  })
  if (error !== null) throw fromDatabase(error)
  if (!data) throw new MemberActionError(noPermission)
}

export async function deactivateMember(institutionId: string, userId: string, values: DeactivateValues): Promise<void> {
  const { data, error } = await supabase.rpc('deactivate_member', {
    p_institution_id: institutionId,
    p_user_id: userId,
    p_reason: values.reason,
  })
  if (error !== null) throw fromDatabase(error)
  if (!data) throw new MemberActionError(noPermission)
}
