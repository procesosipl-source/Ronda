import { describe, expect, it } from 'vitest'
import { validateLogin } from './loginForm'

describe('validateLogin', () => {
  it('acepta un email y una contraseña', () => {
    const result = validateLogin({ email: 'ana@clinica.test', password: 'secreta' })
    expect(result).toEqual({ ok: true, values: { email: 'ana@clinica.test', password: 'secreta' } })
  })

  it('quita los espacios de más del email, pero no de la contraseña', () => {
    const result = validateLogin({ email: '  ana@clinica.test ', password: ' con espacio ' })
    expect(result).toEqual({ ok: true, values: { email: 'ana@clinica.test', password: ' con espacio ' } })
  })

  it('pide los dos datos si están vacíos', () => {
    const result = validateLogin({ email: '', password: '' })
    expect(result).toEqual({
      ok: false,
      errors: { email: 'Escribí tu email.', password: 'Escribí tu contraseña.' },
    })
  })

  it('avisa si el email está mal escrito', () => {
    const result = validateLogin({ email: 'ana@clinica', password: 'secreta' })
    expect(result).toEqual({
      ok: false,
      errors: { email: 'Revisá el email: parece que le falta algo.' },
    })
  })

  it('muestra un solo mensaje por campo', () => {
    const result = validateLogin({ email: '   ', password: 'secreta' })
    expect(result).toEqual({ ok: false, errors: { email: 'Escribí tu email.' } })
  })
})
