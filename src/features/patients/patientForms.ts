import { z } from 'zod'
import { documentTypes, normalizeDocument, registeredSexes } from './patientRules'

/**
 * Alta de paciente (flujo 01). Valida en la pantalla para avisar rápido; la base vuelve a
 * validar todo en create_patient (regla 3). `today` permite testear la fecha futura.
 */
export function newPatientSchema(today: string) {
  return z
    .object({
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
      phone: z.string().trim(),
      email: z.union([z.literal(''), z.string().trim().pipe(z.email({ message: 'Revisá el email: parece que le falta algo.' }))]),
    })
    .refine((values) => values.documentType !== 'dni' || /^[0-9]{7,8}$/.test(normalizeDocument(values.documentNumber)), {
      message: 'El DNI tiene que tener 7 u 8 números.',
      path: ['documentNumber'],
    })
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
}
