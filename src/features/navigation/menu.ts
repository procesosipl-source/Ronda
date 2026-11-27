/**
 * Qué secciones del menú ve cada rol (tabla acordada en la semana 4).
 *
 * Esto solo REFLEJA permisos para armar el menú (regla 3 de CLAUDE.md): ocultar una
 * sección no protege nada. Lo que cada persona puede leer o escribir lo decide RLS en la base.
 */

export const roleCodes = ['director', 'coordinator', 'administration', 'reception', 'professional', 'nursing'] as const

export type RoleCode = (typeof roleCodes)[number]

export function isRoleCode(value: string): value is RoleCode {
  return (roleCodes as readonly string[]).includes(value)
}

export interface MenuSection {
  key: string
  label: string
  /** Roles que la ven. `'all'` = cualquier rol. */
  roles: readonly RoleCode[] | 'all'
  /** Dirección de la pantalla, si ya está construida. */
  path?: string
  /** Cuándo llega, si todavía no está construida. Se muestra al tocar la etiqueta "Próximamente". */
  arrives?: string
}

const everyone: readonly RoleCode[] = roleCodes

export const menuSections: readonly MenuSection[] = [
  { key: 'home', label: 'Inicio', roles: 'all', path: '/' },
  { key: 'day-panel', label: 'Panel de turnos', roles: everyone, arrives: 'Llega en la semana 13.' },
  { key: 'schedule', label: 'Agenda', roles: ['director', 'coordinator', 'administration', 'reception', 'professional'], arrives: 'Llega en la semana 10.' },
  { key: 'patients', label: 'Pacientes', roles: everyone, arrives: 'Llega en la semana 6.' },
  { key: 'professionals', label: 'Profesionales', roles: ['director', 'coordinator', 'administration', 'reception'], arrives: 'Llega en la semana 9.' },
  { key: 'groups', label: 'Grupos y talleres', roles: ['director', 'coordinator', 'professional'], arrives: 'Llega en la semana 20.' },
  { key: 'admissions', label: 'Internación', roles: ['director', 'coordinator', 'professional', 'nursing'], arrives: 'Llega en la semana 34.' },
  { key: 'medication', label: 'Medicación', roles: ['director', 'coordinator', 'professional', 'nursing'], arrives: 'Llega en la semana 36.' },
  { key: 'authorizations', label: 'Autorizaciones', roles: ['director', 'administration'], arrives: 'Llega en la semana 24.' },
  { key: 'billing', label: 'Prefacturación', roles: ['director', 'administration'], arrives: 'Llega en la semana 26.' },
  { key: 'metrics', label: 'Métricas', roles: ['director', 'coordinator', 'administration'], arrives: 'Llega con los indicadores, más adelante.' },
  { key: 'settings', label: 'Configuración', roles: ['director'], arrives: 'Llega en la semana 5.' },
  { key: 'audit', label: 'Auditoría', roles: ['director'], path: '/auditoria' },
]

/** Secciones que ve una persona. Con varios roles, se suman. */
export function visibleSections(roles: readonly string[]): MenuSection[] {
  const known = roles.filter(isRoleCode)
  if (known.length === 0) return []
  return menuSections.filter((section) => section.roles === 'all' || section.roles.some((role) => known.includes(role)))
}
