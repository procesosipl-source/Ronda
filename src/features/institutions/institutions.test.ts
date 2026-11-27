import { describe, expect, it } from 'vitest'
import {
  groupMemberships,
  parseStoredInstitution,
  serializeStoredInstitution,
  sessionIdFromToken,
  type MembershipRow,
} from './institutions'

const alamos = { id: 'a', name: 'Clínica Los Álamos' }
const aconcagua = { id: 'b', name: 'Centro Aconcagua' }
const director = { code: 'director', name: 'Dirección', sort_order: 1 }
const professional = { code: 'professional', name: 'Profesional', sort_order: 5 }

describe('groupMemberships', () => {
  it('junta los roles de una misma institución, en el orden del catálogo', () => {
    const rows: MembershipRow[] = [
      { institution: alamos, role: professional },
      { institution: alamos, role: director },
    ]
    expect(groupMemberships(rows)).toEqual([
      { id: 'a', name: 'Clínica Los Álamos', roles: [{ code: 'director', name: 'Dirección' }, { code: 'professional', name: 'Profesional' }], modules: [] },
    ])
  })

  it('ordena las instituciones por nombre', () => {
    const rows: MembershipRow[] = [
      { institution: alamos, role: professional },
      { institution: aconcagua, role: professional },
    ]
    expect(groupMemberships(rows).map((i) => i.name)).toEqual(['Centro Aconcagua', 'Clínica Los Álamos'])
  })

  it('suma a cada institución solo sus módulos activos', () => {
    const rows: MembershipRow[] = [
      { institution: alamos, role: professional },
      { institution: aconcagua, role: professional },
    ]
    const modules = [
      { institution_id: 'a', module: { code: 'inpatient' } },
      { institution_id: 'a', module: { code: 'coverage' } },
      { institution_id: 'b', module: { code: 'coverage' } },
    ]
    expect(groupMemberships(rows, modules).map((i) => [i.name, i.modules])).toEqual([
      ['Centro Aconcagua', ['coverage']],
      ['Clínica Los Álamos', ['coverage', 'inpatient']],
    ])
  })

  it('descarta las filas sin institución visible', () => {
    expect(groupMemberships([{ institution: null, role: director }])).toEqual([])
  })
})

describe('sessionIdFromToken', () => {
  const token = (claims: object) => `x.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.y`

  it('lee el session_id del token', () => {
    expect(sessionIdFromToken(token({ sub: 'u', session_id: 's-1' }))).toBe('s-1')
  })

  it('devuelve null si el token no tiene sesión o está mal formado', () => {
    expect(sessionIdFromToken(token({ sub: 'u' }))).toBeNull()
    expect(sessionIdFromToken('no-es-un-token')).toBeNull()
    expect(sessionIdFromToken('x.%%%.y')).toBeNull()
  })
})

describe('parseStoredInstitution', () => {
  it('devuelve la institución si es de la misma sesión', () => {
    expect(parseStoredInstitution(serializeStoredInstitution('s-1', 'a'), 's-1')).toBe('a')
  })

  it('pide elegir de nuevo en una sesión nueva', () => {
    expect(parseStoredInstitution(serializeStoredInstitution('s-1', 'a'), 's-2')).toBeNull()
  })

  it('ignora lo guardado si está vacío o roto', () => {
    expect(parseStoredInstitution(null, 's-1')).toBeNull()
    expect(parseStoredInstitution('{roto', 's-1')).toBeNull()
  })
})
