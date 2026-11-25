import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrors'

describe('authErrorMessage', () => {
  it('no dice si falló el email o la contraseña', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe(
      'El email o la contraseña no coinciden.',
    )
  })

  it('avisa cuando hay demasiados intentos', () => {
    expect(authErrorMessage({ code: 'over_request_rate_limit', status: 429 })).toBe(
      'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.',
    )
  })

  it('avisa cuando no hay conexión', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(
      'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.',
    )
  })

  it('usa un mensaje general para errores desconocidos', () => {
    expect(authErrorMessage({ code: 'algo_nuevo', status: 500 })).toBe(
      'Algo salió mal. Probá de nuevo en unos minutos.',
    )
  })
})
