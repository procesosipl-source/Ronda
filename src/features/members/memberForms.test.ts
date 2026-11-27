import { describe, expect, it } from 'vitest'
import { validate } from '../../lib/formValidation'
import { changeRolesSchema, deactivateSchema, inviteSchema } from './memberForms'

describe('inviteSchema', () => {
  it('acepta una invitación completa y limpia los espacios', () => {
    expect(validate(inviteSchema, { fullName: ' Ana Pérez ', email: ' ana@ronda.test ', roleCodes: ['nursing'] })).toEqual({
      ok: true,
      values: { fullName: 'Ana Pérez', email: 'ana@ronda.test', roleCodes: ['nursing'] },
    })
  })

  it('pide nombre, un email válido y al menos un rol', () => {
    expect(validate(inviteSchema, { fullName: '', email: 'ana@', roleCodes: [] })).toEqual({
      ok: false,
      errors: {
        fullName: 'Escribí el nombre y apellido.',
        email: 'Revisá el email: parece que le falta algo.',
        roleCodes: 'Elegí al menos un rol.',
      },
    })
  })

  it('rechaza un rol que no existe', () => {
    expect(validate(inviteSchema, { fullName: 'Ana', email: 'ana@ronda.test', roleCodes: ['superadmin'] }).ok).toBe(false)
  })
})

describe('changeRolesSchema', () => {
  it('pide un motivo que no sea solo espacios', () => {
    expect(validate(changeRolesSchema, { roleCodes: ['reception'], reason: '   ' })).toEqual({
      ok: false,
      errors: { reason: 'Escribí el motivo del cambio.' },
    })
  })
})

describe('deactivateSchema', () => {
  it('pide el motivo de la baja', () => {
    expect(validate(deactivateSchema, { reason: '' })).toEqual({ ok: false, errors: { reason: 'Escribí el motivo de la baja.' } })
  })
})
