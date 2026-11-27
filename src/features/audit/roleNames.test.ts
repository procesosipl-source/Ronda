import { describe, expect, it } from 'vitest'
import { roleNames } from './roleNames'

describe('roleNames', () => {
  it('traduce los códigos de rol al español', () => {
    expect(roleNames(['director', 'professional'])).toBe('Dirección · Profesional')
  })

  it('devuelve vacío si la persona no tenía rol', () => {
    expect(roleNames([])).toBe('')
  })
})
