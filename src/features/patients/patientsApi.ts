import { supabase } from '../../lib/supabase'
import type { ContactDataValues, NewPatientValues, PatientContactValues, PersonalDataValues, StatusChangeValues } from './patientForms'
import { normalizeDocument } from './patientRules'

/** Roles que ven pacientes hoy. Coincide con private.can_read_patients en la base. */
export const patientReaderRoles = ['director', 'coordinator', 'administration', 'reception']
/** Roles que dan de alta pacientes y editan sus datos y referentes (flujo 01). Coincide con la base. */
export const patientCreatorRoles = ['director', 'administration', 'reception']
/** Roles que cambian el estado (flujo 02, decidido el 30/11/2026). Coincide con change_patient_status. */
export const patientStatusRoles = ['director', 'administration']

const connectionError = 'No pudimos guardar el cambio. Revisá tu conexión y volvé a intentar.'
const noPermission = 'No tenés permiso para hacer esto en esta institución.'

export class PatientError extends Error {}

export async function searchPatients(institutionId: string, query: string) {
  const { data, error } = await supabase.rpc('search_patients', { p_institution_id: institutionId, p_query: query, p_limit: 50 })
  if (error !== null) throw new PatientError('No pudimos buscar pacientes. Revisá tu conexión y volvé a intentar.')
  return data
}

/** Si ya hay un paciente con ese documento en la institución, lo devuelve (flujo 01: no se duplica). */
export async function findByDocument(institutionId: string, documentType: string, documentNumber: string) {
  const normalized = normalizeDocument(documentNumber)
  if (normalized === '') return null
  const { data, error } = await supabase
    .from('patient')
    .select('id, first_name, last_name, chosen_name')
    .eq('institution_id', institutionId)
    .eq('document_type', documentType)
    .eq('document_number_normalized', normalized)
    .maybeSingle()
  if (error !== null) return null
  return data
}

export async function createPatient(institutionId: string, values: NewPatientValues): Promise<string> {
  const { data, error } = await supabase.rpc('create_patient', {
    p_institution_id: institutionId,
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_document_type: values.documentType,
    p_document_number: values.documentNumber,
    p_birth_date: values.birthDate,
    p_registered_sex: values.registeredSex === '' ? undefined : values.registeredSex,
    p_chosen_name: values.chosenName === '' ? undefined : values.chosenName,
    p_phone: values.phone === '' ? undefined : values.phone,
    p_email: values.email === '' ? undefined : values.email,
  })
  if (error !== null) {
    throw new PatientError(error.code === 'P0001' ? error.message : 'No pudimos guardar el paciente. Revisá tu conexión y volvé a intentar.')
  }
  if (data === null) throw new PatientError('No tenés permiso para dar de alta pacientes en esta institución.')
  return data
}

export async function getPatient(institutionId: string, patientId: string) {
  const { data, error } = await supabase
    .from('patient')
    .select(
      'id, first_name, last_name, chosen_name, document_type, document_number, birth_date, registered_sex, phone, email, address, created_at, status_id, status:patient_status(name)',
    )
    .eq('institution_id', institutionId)
    .eq('id', patientId)
    .maybeSingle()
  if (error !== null) throw new PatientError('No pudimos cargar el paciente. Revisá tu conexión y volvé a intentar.')
  return data
}

export type Patient = NonNullable<Awaited<ReturnType<typeof getPatient>>>

/** Estados a los que se puede pasar desde el actual (transiciones configuradas en la institución). */
export async function allowedNextStatuses(institutionId: string, fromStatusId: string) {
  const { data, error } = await supabase
    .from('patient_status_transition')
    .select('to_status:patient_status!patient_status_transition_institution_id_to_status_id_fkey(id, name, sort_order)')
    .eq('institution_id', institutionId)
    .eq('from_status_id', fromStatusId)
    .is('deleted_at', null)
  if (error !== null) throw new PatientError('No pudimos cargar los estados. Revisá tu conexión y volvé a intentar.')
  return data
    .map((row) => row.to_status)
    .filter((status) => status !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function changePatientStatus(institutionId: string, patientId: string, values: StatusChangeValues) {
  const { data, error } = await supabase.rpc('change_patient_status', {
    p_institution_id: institutionId,
    p_patient_id: patientId,
    p_to_status_id: values.toStatusId,
    p_reason: values.reason,
  })
  if (error !== null) throw new PatientError(error.code === 'P0001' ? error.message : connectionError)
  if (!data) throw new PatientError(noPermission)
}

/** Guarda los datos del paciente. Se mandan todos: los que no cambian, con su valor actual. */
export async function updatePatient(
  institutionId: string,
  patient: Patient,
  changes: Partial<PersonalDataValues & ContactDataValues>,
) {
  const current = {
    firstName: patient.first_name,
    lastName: patient.last_name,
    chosenName: patient.chosen_name ?? '',
    documentType: patient.document_type,
    documentNumber: patient.document_number,
    birthDate: patient.birth_date,
    registeredSex: patient.registered_sex ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
  }
  const v = { ...current, ...changes }
  const { data, error } = await supabase.rpc('update_patient', {
    p_institution_id: institutionId,
    p_patient_id: patient.id,
    p_first_name: v.firstName,
    p_last_name: v.lastName,
    p_chosen_name: v.chosenName,
    p_document_type: v.documentType,
    p_document_number: v.documentNumber,
    p_birth_date: v.birthDate,
    p_registered_sex: v.registeredSex === '' ? (null as unknown as string) : v.registeredSex,
    p_phone: v.phone,
    p_email: v.email,
    p_address: v.address,
  })
  if (error !== null) throw new PatientError(error.code === 'P0001' ? error.message : connectionError)
  if (!data) throw new PatientError(noPermission)
}

export async function getStatusHistory(institutionId: string, patientId: string) {
  const { data, error } = await supabase
    .from('patient_status_history')
    .select(
      'id, changed_at, reason, from_status:patient_status!patient_status_history_institution_id_from_status_id_fkey(name), to_status:patient_status!patient_status_history_institution_id_to_status_id_fkey(name), changer:user_profile!patient_status_history_changed_by_profile_fkey(full_name)',
    )
    .eq('institution_id', institutionId)
    .eq('patient_id', patientId)
    .order('changed_at', { ascending: false })
  if (error !== null) throw new PatientError('No pudimos cargar el historial. Revisá tu conexión y volvé a intentar.')
  return data
}

export async function listContacts(institutionId: string, patientId: string) {
  const { data, error } = await supabase
    .from('patient_contact')
    .select('id, full_name, relationship, phone, is_primary')
    .eq('institution_id', institutionId)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('is_primary', { ascending: false })
    .order('full_name')
  if (error !== null) throw new PatientError('No pudimos cargar los referentes. Revisá tu conexión y volvé a intentar.')
  return data
}
export type PatientContact = Awaited<ReturnType<typeof listContacts>>[number]

export async function saveContact(institutionId: string, patientId: string, values: PatientContactValues, contactId?: string) {
  const row = { full_name: values.fullName, relationship: values.relationship, phone: values.phone, is_primary: values.isPrimary }
  const { error } =
    contactId === undefined
      ? await supabase.from('patient_contact').insert({ ...row, institution_id: institutionId, patient_id: patientId })
      : await supabase.from('patient_contact').update(row).eq('institution_id', institutionId).eq('id', contactId)
  if (error !== null) throw new PatientError(error.code === '42501' ? noPermission : connectionError)
}

/** Quitar un referente es darlo de baja (regla 6): queda en la base con la marca. */
export async function removeContact(institutionId: string, contactId: string) {
  const { error } = await supabase
    .from('patient_contact')
    .update({ deleted_at: new Date().toISOString() })
    .eq('institution_id', institutionId)
    .eq('id', contactId)
  if (error !== null) throw new PatientError(error.code === '42501' ? noPermission : connectionError)
}
