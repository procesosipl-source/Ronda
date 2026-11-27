import { describe, expect, it } from 'vitest'
import { validate } from '../../lib/formValidation'
import { payerKindLabel, payerSchema } from './payers'

describe('payerSchema', () => {
  it('pide nombre', () => {
    expect(validate(payerSchema, { name: ' ', kind: 'prepaid', requiresMemberNumber: true, nationalCode: '' })).toEqual({
      ok: false,
      errors: { name: 'Escribí el nombre.' },
    })
  })

  it('un Particular nunca pide número de afiliado, aunque se marque', () => {
    const result = validate(payerSchema, { name: 'Particular', kind: 'private', requiresMemberNumber: true, nationalCode: '' })
    expect(result).toEqual({ ok: true, values: { name: 'Particular', kind: 'private', requiresMemberNumber: false, nationalCode: '' } })
  })
})

describe('payerKindLabel', () => {
  it('traduce el tipo', () => {
    expect(payerKindLabel('social_security')).toBe('Obra social')
    expect(payerKindLabel('prepaid')).toBe('Prepaga')
  })
})
