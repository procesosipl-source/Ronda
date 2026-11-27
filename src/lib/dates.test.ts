import { describe, expect, it } from 'vitest'
import { formatDateTime } from './dates'

describe('formatDateTime', () => {
  it('muestra la hora de Argentina, tres horas menos que UTC', () => {
    expect(formatDateTime('2026-11-27T17:05:00Z')).toBe('27/11/2026 14:05')
  })

  it('cambia de día cuando en UTC ya es el día siguiente', () => {
    expect(formatDateTime('2026-11-28T01:30:00Z')).toBe('27/11/2026 22:30')
  })

  it('usa formato de 24 horas', () => {
    expect(formatDateTime('2026-11-27T03:00:00Z')).toBe('27/11/2026 00:00')
  })
})
