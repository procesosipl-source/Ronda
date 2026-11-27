import { supabase } from '../../lib/supabase'
import type { NewPatientValues } from './patientForms'
import { normalizeDocument } from './patientRules'

/** Roles que ven pacientes hoy. Coincide con private.can_read_patients en la base. */
export const patientReaderRoles = ['director', 'coordinator', 'administration', 'reception']
/** Roles que dan de alta pacientes (flujo 01). Coincide con create_patient en la base. */
export const patientCreatorRoles = ['director', 'administration', 'reception']

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
      'id, first_name, last_name, chosen_name, document_type, document_number, birth_date, registered_sex, phone, email, created_at, status:patient_status(name)',
    )
    .eq('institution_id', institutionId)
    .eq('id', patientId)
    .maybeSingle()
  if (error !== null) throw new PatientError('No pudimos cargar el paciente. Revisá tu conexión y volvé a intentar.')
  return data
}
