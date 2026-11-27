import { describe, expect, it } from 'vitest'
import { ageOn, displayName, formatDate, listName, normalizeDocument, todayInMendoza } from './patientRules'

describe('normalizeDocument', () => {
  it('saca puntos, espacios y guiones, igual que la base', () => {
    expect(normalizeDocument('30.123.456')).toBe('30123456')
    expect(normalizeDocument(' 30 123-456 ')).toBe('30123456')
    expect(normalizeDocument('ab-123456')).toBe('AB123456')
  })
})

describe('ageOn', () => {
  it('cuenta los años cumplidos', () => {
    expect(ageOn('1998-03-14', '2026-12-07')).toBe(28)
  })

  it('el día del cumpleaños ya los cumplió', () => {
    expect(ageOn('1998-12-07', '2026-12-07')).toBe(28)
  })

  it('el día anterior todavía no', () => {
    expect(ageOn('1998-12-08', '2026-12-07')).toBe(27)
  })
})

describe('todayInMendoza', () => {
  it('usa la fecha de Mendoza aunque en UTC ya sea mañana', () => {
    expect(todayInMendoza(new Date('2026-12-08T01:00:00Z'))).toBe('2026-12-07')
  })
})

describe('formatDate', () => {
  it('muestra la fecha como día/mes/año', () => {
    expect(formatDate('1998-03-14')).toBe('14/03/1998')
  })
})

describe('displayName y listName', () => {
  const vale = { first_name: 'Valentín', last_name: 'Núñez', chosen_name: 'Vale' }
  const rosa = { first_name: 'Rosa', last_name: 'Álvarez', chosen_name: null }

  it('usan el nombre elegido cuando está cargado', () => {
    expect(displayName(vale)).toBe('Vale Núñez')
    expect(listName(vale)).toBe('Núñez, Vale')
  })

  it('si no, usan el nombre del documento', () => {
    expect(displayName(rosa)).toBe('Rosa Álvarez')
    expect(listName(rosa)).toBe('Álvarez, Rosa')
  })
})
