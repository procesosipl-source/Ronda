import { z } from 'zod'
import { documentTypes, normalizeDocument, registeredSexes, relationships } from './patientRules'

/**
 * Formularios del paciente (flujos 01 y 02). Validan en la pantalla para avisar rápido;
 * la base vuelve a validar todo (regla 3). `today` permite testear la fecha futura.
 */

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().pipe(z.email({ message: 'Revisá el email: parece que le falta algo.' })),
])

function personalFields(today: string) {
  return {
    firstName: z.string().trim().min(1, { message: 'Escribí el nombre.' }),
    lastName: z.string().trim().min(1, { message: 'Escribí el apellido.' }),
    chosenName: z.string().trim(),
    documentType: z.enum(documentTypes, { message: 'Elegí el tipo de documento.' }),
    documentNumber: z.string().trim().min(1, { message: 'Escribí el número de documento.' }),
    birthDate: z
      .string()
      .min(1, { message: 'Escribí la fecha de nacimiento.' })
      .refine((value) => value <= today, { message: 'La fecha de nacimiento no puede ser futura.' })
      .refine((value) => value >= '1900-01-01', { message: 'Revisá la fecha de nacimiento.' }),
    registeredSex: z.union([z.enum(registeredSexes), z.literal('')]),
  }
}

const dniRule = {
  check: (values: { documentType: string; documentNumber: string }) =>
    values.documentType !== 'dni' || /^[0-9]{7,8}$/.test(normalizeDocument(values.documentNumber)),
  params: { message: 'El DNI tiene que tener 7 u 8 números.', path: ['documentNumber'] },
}

/**
 * La obra social es obligatoria; el número de afiliado, solo si esa obra social lo pide.
 * `requiringMemberNumber` son los ids de las obras sociales que lo piden (salen del catálogo).
 */
function coverageFields() {
  return {
    payerId: z.string().min(1, { message: 'Elegí la obra social.' }),
    memberNumber: z.string().trim(),
  }
}

function memberNumberRule(requiringMemberNumber: readonly string[]) {
  return {
    check: (values: { payerId: string; memberNumber: string }) =>
      !requiringMemberNumber.includes(values.payerId) || values.memberNumber.length > 0,
    params: { message: 'Escribí el número de afiliado: esta obra social lo pide.', path: ['memberNumber'] },
  }
}

/** Alta de paciente, con su cobertura (decidido en la semana 6, se suma en la 8). */
export function newPatientSchema(today: string, requiringMemberNumber: readonly string[] = []) {
  const memberRule = memberNumberRule(requiringMemberNumber)
  return z
    .object({ ...personalFields(today), phone: z.string().trim(), email: optionalEmail, ...coverageFields() })
    .refine(dniRule.check, dniRule.params)
    .refine(memberRule.check, memberRule.params)
}
export type NewPatientValues = z.infer<ReturnType<typeof newPatientSchema>>

export const emptyNewPatient: NewPatientValues = {
  firstName: '',
  lastName: '',
  chosenName: '',
  documentType: 'dni',
  documentNumber: '',
  birthDate: '',
  registeredSex: '',
  phone: '',
  email: '',
  payerId: '',
  memberNumber: '',
}

/** Panel "Datos personales" de la ficha. */
export function personalDataSchema(today: string) {
  return z.object(personalFields(today)).refine(dniRule.check, dniRule.params)
}
export type PersonalDataValues = z.infer<ReturnType<typeof personalDataSchema>>

/** Panel "Contacto y domicilio" de la ficha. */
export const contactDataSchema = z.object({
  phone: z.string().trim(),
  email: optionalEmail,
  address: z.string().trim(),
})
export type ContactDataValues = z.infer<typeof contactDataSchema>

/** Un referente: familiar o contacto responsable. */
export const patientContactSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Escribí el nombre y apellido.' }),
  relationship: z.enum(relationships, { message: 'Elegí el parentesco.' }),
  phone: z.string().trim().min(1, { message: 'Escribí un teléfono.' }),
  isPrimary: z.boolean(),
})
export type PatientContactValues = z.infer<typeof patientContactSchema>

/** Cambio de estado (flujo 02). */
export const statusChangeSchema = z.object({
  toStatusId: z.string().min(1, { message: 'Elegí el estado nuevo.' }),
  reason: z.string().trim().min(1, { message: 'Escribí el motivo del cambio.' }),
})
export type StatusChangeValues = z.infer<typeof statusChangeSchema>

/** Cambio de cobertura en la ficha. */
export function coverageSchema(today: string, requiringMemberNumber: readonly string[]) {
  const memberRule = memberNumberRule(requiringMemberNumber)
  return z
    .object({
      ...coverageFields(),
      validFrom: z
        .string()
        .min(1, { message: 'Escribí desde cuándo rige.' })
        .refine((value) => value <= today, { message: 'La cobertura no puede empezar en el futuro.' }),
    })
    .refine(memberRule.check, memberRule.params)
}
export type CoverageValues = z.infer<ReturnType<typeof coverageSchema>>
