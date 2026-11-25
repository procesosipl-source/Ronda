import { describe, expect, it } from 'vitest'
import { validate } from '../../lib/formValidation'
import { forgotPasswordSchema, loginSchema, newPasswordSchema } from './authForms'

describe('ingreso', () => {
  it('acepta un email y una contraseña', () => {
    expect(validate(loginSchema, { email: 'ana@clinica.test', password: 'secreta' })).toEqual({
      ok: true,
      values: { email: 'ana@clinica.test', password: 'secreta' },
    })
  })

  it('quita los espacios de más del email, pero no de la contraseña', () => {
    expect(validate(loginSchema, { email: '  ana@clinica.test ', password: ' con espacio ' })).toEqual({
      ok: true,
      values: { email: 'ana@clinica.test', password: ' con espacio ' },
    })
  })

  it('pide los dos datos si están vacíos', () => {
    expect(validate(loginSchema, { email: '', password: '' })).toEqual({
      ok: false,
      errors: { email: 'Escribí tu email.', password: 'Escribí tu contraseña.' },
    })
  })

  it('avisa si el email está mal escrito', () => {
    expect(validate(loginSchema, { email: 'ana@clinica', password: 'secreta' })).toEqual({
      ok: false,
      errors: { email: 'Revisá el email: parece que le falta algo.' },
    })
  })

  it('muestra un solo mensaje por campo', () => {
    expect(validate(loginSchema, { email: '   ', password: 'secreta' })).toEqual({
      ok: false,
      errors: { email: 'Escribí tu email.' },
    })
  })
})

describe('recuperar contraseña', () => {
  it('pide el email', () => {
    expect(validate(forgotPasswordSchema, { email: '' })).toEqual({
      ok: false,
      errors: { email: 'Escribí tu email.' },
    })
  })
})

describe('contraseña nueva', () => {
  it('acepta dos contraseñas iguales de 10 caracteres o más', () => {
    expect(validate(newPasswordSchema, { password: 'diez-letra', confirmation: 'diez-letra' })).toEqual({
      ok: true,
      values: { password: 'diez-letra', confirmation: 'diez-letra' },
    })
  })

  it('rechaza una contraseña corta', () => {
    expect(validate(newPasswordSchema, { password: 'corta', confirmation: 'corta' })).toEqual({
      ok: false,
      errors: { password: 'La contraseña tiene que tener al menos 10 caracteres.' },
    })
  })

  it('avisa si no coinciden', () => {
    expect(
      validate(newPasswordSchema, { password: 'una-contraseña-larga', confirmation: 'otra-contraseña-larga' }),
    ).toEqual({
      ok: false,
      errors: { confirmation: 'Las dos contraseñas no coinciden.' },
    })
  })

  it('pide repetirla si falta la confirmación', () => {
    expect(validate(newPasswordSchema, { password: 'una-contraseña-larga', confirmation: '' })).toEqual({
      ok: false,
      errors: { confirmation: 'Repetí la contraseña nueva.' },
    })
  })
})
