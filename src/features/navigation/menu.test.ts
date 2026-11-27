import { describe, expect, it } from 'vitest'
import { visibleSections } from './menu'

const labels = (roles: string[]) => visibleSections(roles).map((section) => section.label)

describe('visibleSections', () => {
  it('Dirección ve todo, incluida Auditoría', () => {
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
      'Configuración',
      'Auditoría',
    ])
  })

  it('Recepción no ve Auditoría ni lo clínico', () => {
    expect(labels(['reception'])).toEqual(['Inicio', 'Panel de turnos', 'Agenda', 'Pacientes', 'Profesionales'])
  })

  it('Enfermería ve internación y medicación, pero no la agenda', () => {
    expect(labels(['nursing'])).toEqual(['Inicio', 'Panel de turnos', 'Pacientes', 'Internación', 'Medicación'])
  })

  it('Administración ve autorizaciones y prefacturación', () => {
    expect(labels(['administration'])).toContain('Prefacturación')
    expect(labels(['administration'])).not.toContain('Auditoría')
  })

  it('con varios roles, las secciones se suman sin repetirse', () => {
    const both = labels(['reception', 'nursing'])
    expect(both).toEqual(['Inicio', 'Panel de turnos', 'Agenda', 'Pacientes', 'Profesionales', 'Internación', 'Medicación'])
  })

  it('sin roles conocidos no se ve nada', () => {
    expect(labels([])).toEqual([])
    expect(labels(['rol-inventado'])).toEqual([])
  })
})
