import { describe, expect, it } from 'vitest'
import { validate } from '../../lib/formValidation'
import { emptyNewPatient, newPatientSchema } from './patientForms'

const schema = newPatientSchema('2026-12-07', ['osep'])
const valid = { ...emptyNewPatient, firstName: 'Martina', lastName: 'Pérez', documentNumber: '40.111.201', birthDate: '1998-03-14', payerId: 'particular' }

describe('newPatientSchema', () => {
  it('acepta un alta con los datos obligatorios', () => {
    expect(validate(schema, valid).ok).toBe(true)
  })

  it('pide nombre, apellido, documento y fecha de nacimiento', () => {
    expect(validate(schema, emptyNewPatient)).toEqual({
      ok: false,
      errors: {
        firstName: 'Escribí el nombre.',
        lastName: 'Escribí el apellido.',
        documentNumber: 'Escribí el número de documento.',
        birthDate: 'Escribí la fecha de nacimiento.',
        payerId: 'Elegí la obra social.',
      },
    })
  })

  it('un DNI tiene que tener 7 u 8 números, con o sin puntos', () => {
    expect(validate(schema, { ...valid, documentNumber: '123' })).toEqual({
      ok: false,
      errors: { documentNumber: 'El DNI tiene que tener 7 u 8 números.' },
    })
    expect(validate(schema, { ...valid, documentNumber: '7.123.456' }).ok).toBe(true)
  })

  it('un pasaporte puede tener letras', () => {
    expect(validate(schema, { ...valid, documentType: 'passport', documentNumber: 'AB123456' }).ok).toBe(true)
  })

  it('rechaza una fecha de nacimiento futura', () => {
    expect(validate(schema, { ...valid, birthDate: '2026-12-08' })).toEqual({
      ok: false,
      errors: { birthDate: 'La fecha de nacimiento no puede ser futura.' },
    })
  })

  it('el email es opcional, pero si está tiene que ser válido', () => {
    expect(validate(schema, { ...valid, email: '' }).ok).toBe(true)
    expect(validate(schema, { ...valid, email: 'martina@' }).ok).toBe(false)
  })
})

describe('formularios de la ficha', () => {
  it('datos personales: mismas reglas que el alta', async () => {
    const { personalDataSchema } = await import('./patientForms')
    const s = personalDataSchema('2026-12-07')
    const base = { firstName: 'M', lastName: 'P', chosenName: '', documentType: 'dni', documentNumber: '40111201', birthDate: '1998-03-14', registeredSex: '' }
    expect(validate(s, base).ok).toBe(true)
    expect(validate(s, { ...base, documentNumber: '12' })).toEqual({ ok: false, errors: { documentNumber: 'El DNI tiene que tener 7 u 8 números.' } })
  })

  it('referente: pide nombre, parentesco de la lista y teléfono', async () => {
    const { patientContactSchema } = await import('./patientForms')
    expect(validate(patientContactSchema, { fullName: '', relationship: 'vecino', phone: '', isPrimary: false })).toEqual({
      ok: false,
      errors: { fullName: 'Escribí el nombre y apellido.', relationship: 'Elegí el parentesco.', phone: 'Escribí un teléfono.' },
    })
  })

  it('cambio de estado: pide estado y motivo', async () => {
    const { statusChangeSchema } = await import('./patientForms')
    expect(validate(statusChangeSchema, { toStatusId: '', reason: ' ' })).toEqual({
      ok: false,
      errors: { toStatusId: 'Elegí el estado nuevo.', reason: 'Escribí el motivo del cambio.' },
    })
  })
})

describe('cobertura', () => {
  it('en el alta, el número de afiliado es obligatorio solo si la obra social lo pide', () => {
    expect(validate(schema, { ...valid, payerId: 'osep', memberNumber: '' })).toEqual({
      ok: false,
      errors: { memberNumber: 'Escribí el número de afiliado: esta obra social lo pide.' },
    })
    expect(validate(schema, { ...valid, payerId: 'osep', memberNumber: '123/01' }).ok).toBe(true)
    expect(validate(schema, { ...valid, payerId: 'particular', memberNumber: '' }).ok).toBe(true)
  })

  it('al cambiarla, no puede empezar en el futuro', async () => {
    const { coverageSchema } = await import('./patientForms')
    const s = coverageSchema('2026-12-07', [])
    expect(validate(s, { payerId: 'particular', memberNumber: '', validFrom: '2026-12-08' })).toEqual({
      ok: false,
      errors: { validFrom: 'La cobertura no puede empezar en el futuro.' },
    })
  })
})
