import { describe, expect, it } from 'vitest'
import { groupSections, visibleSections } from './menu'

const allModules = ['coverage', 'groups', 'inpatient', 'medication']
const labels = (roles: string[], modules: string[] = allModules) => visibleSections(roles, modules).map((s) => s.label)

describe('visibleSections', () => {
  it('Dirección ve todo, incluidas Auditoría y Configuración', () => {
    expect(labels(['director'])).toEqual([
      'Inicio',
      'Panel de turnos',
      'Agenda',
      'Pacientes',
      'Profesionales',
      'Grupos y talleres',
      'Internación',
      'Medicación',
      'Autorizaciones',
      'Prefacturación',
      'Métricas',
      'Auditoría',
      'Configuración',
      'Ayuda',
    ])
  })

  it('Recepción no ve Auditoría ni lo clínico', () => {
    expect(labels(['reception'])).toEqual(['Inicio', 'Panel de turnos', 'Agenda', 'Pacientes', 'Profesionales', 'Ayuda'])
  })

  it('Enfermería ve internación y medicación, pero no la agenda', () => {
    expect(labels(['nursing'])).toEqual(['Inicio', 'Panel de turnos', 'Pacientes', 'Internación', 'Medicación', 'Ayuda'])
  })

  it('con varios roles, las secciones se suman sin repetirse', () => {
    expect(labels(['reception', 'nursing'])).toEqual([
      'Inicio',
      'Panel de turnos',
      'Agenda',
      'Pacientes',
      'Profesionales',
      'Internación',
      'Medicación',
      'Ayuda',
    ])
  })

  it('sin roles conocidos no se ve nada', () => {
    expect(labels([])).toEqual([])
    expect(labels(['rol-inventado'])).toEqual([])
  })

  it('sin el módulo de Internación, Dirección no ve Internación', () => {
    const shown = labels(['director'], ['coverage', 'groups'])
    expect(shown).not.toContain('Internación')
    expect(shown).not.toContain('Medicación')
    expect(shown).toContain('Autorizaciones')
  })

  it('las secciones de la Base se ven aunque no haya ningún módulo activo', () => {
    expect(labels(['director'], [])).toEqual([
      'Inicio',
      'Panel de turnos',
      'Agenda',
      'Pacientes',
      'Profesionales',
      'Métricas',
      'Auditoría',
      'Configuración',
      'Ayuda',
    ])
  })
})

describe('groupSections', () => {
  it('arma los tres bloques en orden, con título solo en Administración', () => {
    const blocks = groupSections(visibleSections(['director'], allModules))
    expect(blocks.map((b) => [b.group, b.title])).toEqual([
      ['daily', null],
      ['admin', 'Administración'],
      ['footer', null],
    ])
  })

  it('no muestra un bloque vacío', () => {
    const blocks = groupSections(visibleSections(['reception'], allModules))
    expect(blocks.map((b) => b.group)).toEqual(['daily', 'footer'])
  })
})
