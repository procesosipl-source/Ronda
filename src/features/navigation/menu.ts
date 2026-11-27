/**
 * Qué secciones del menú ve cada persona (tabla acordada en la semana 4).
 *
 * Esto solo REFLEJA permisos para armar el menú (regla 3 de CLAUDE.md): ocultar una
 * sección no protege nada. Lo que cada persona puede leer o escribir lo decide RLS en la base,
 * y los módulos apagados los rechaza la base con module_enabled() (ADR 0003).
 */
import type { IconName } from './icons'

export const roleCodes = ['director', 'coordinator', 'administration', 'reception', 'professional', 'nursing'] as const

export type RoleCode = (typeof roleCodes)[number]

export function isRoleCode(value: string): value is RoleCode {
  return (roleCodes as readonly string[]).includes(value)
}

/** Bloques del menú (docs/diseno.md): uso diario sin título, Administración con título, y al pie. */
export type MenuGroup = 'daily' | 'admin' | 'footer'

export const menuGroupTitles: Record<MenuGroup, string | null> = {
  daily: null,
  admin: 'Administración',
  footer: null,
}

export interface MenuSection {
  key: string
  label: string
  icon: IconName
  group: MenuGroup
  /** Roles que la ven. `'all'` = cualquier rol. */
  roles: readonly RoleCode[] | 'all'
  /** Módulo que la institución tiene que tener activo. Sin módulo = parte de la Base. */
  module?: string
  /** Dirección de la pantalla, si ya está construida. */
  path?: string
  /** Cuándo llega, si todavía no está construida. Se muestra al tocar la etiqueta "Próximamente". */
  arrives?: string
}

const everyone: readonly RoleCode[] = roleCodes

export const menuSections: readonly MenuSection[] = [
  { key: 'home', label: 'Inicio', icon: 'home', group: 'daily', roles: 'all', path: '/' },
  { key: 'day-panel', label: 'Panel de turnos', icon: 'clipboard', group: 'daily', roles: everyone, arrives: 'Llega en la semana 13.' },
  { key: 'schedule', label: 'Agenda', icon: 'calendar', group: 'daily', roles: ['director', 'coordinator', 'administration', 'reception', 'professional'], arrives: 'Llega en la semana 10.' },
  { key: 'patients', label: 'Pacientes', icon: 'user', group: 'daily', roles: everyone, path: '/pacientes' },
  { key: 'professionals', label: 'Profesionales', icon: 'stethoscope', group: 'daily', roles: ['director', 'coordinator', 'administration', 'reception'], arrives: 'Llega en la semana 9.' },
  { key: 'groups', label: 'Grupos y talleres', icon: 'users', group: 'admin', roles: ['director', 'coordinator', 'professional'], module: 'groups', arrives: 'Llega en la semana 20.' },
  { key: 'admissions', label: 'Internación', icon: 'bed', group: 'admin', roles: ['director', 'coordinator', 'professional', 'nursing'], module: 'inpatient', arrives: 'Llega en la semana 34.' },
  { key: 'medication', label: 'Medicación', icon: 'pill', group: 'admin', roles: ['director', 'coordinator', 'professional', 'nursing'], module: 'medication', arrives: 'Llega en la semana 36.' },
  { key: 'authorizations', label: 'Autorizaciones', icon: 'fileCheck', group: 'admin', roles: ['director', 'administration'], module: 'coverage', arrives: 'Llega en la semana 24.' },
  { key: 'billing', label: 'Prefacturación', icon: 'receipt', group: 'admin', roles: ['director', 'administration'], module: 'coverage', arrives: 'Llega en la semana 26.' },
  { key: 'payers', label: 'Obras sociales', icon: 'idCard', group: 'admin', roles: ['director', 'administration'], path: '/obras-sociales' },
  { key: 'metrics', label: 'Métricas', icon: 'chart', group: 'admin', roles: ['director', 'coordinator', 'administration'], arrives: 'Llega con los indicadores, más adelante.' },
  { key: 'audit', label: 'Auditoría', icon: 'shield', group: 'admin', roles: ['director'], path: '/auditoria' },
  { key: 'settings', label: 'Configuración', icon: 'settings', group: 'footer', roles: ['director'], path: '/configuracion' },
  { key: 'help', label: 'Ayuda', icon: 'help', group: 'footer', roles: 'all', arrives: 'Llega más adelante.' },
]

/**
 * Secciones que ve una persona: las de sus roles (con varios roles, se suman) y solo las
 * de los módulos activos en su institución.
 */
export function visibleSections(roles: readonly string[], activeModules: readonly string[]): MenuSection[] {
  const known = roles.filter(isRoleCode)
  if (known.length === 0) return []
  return menuSections.filter(
    (section) =>
      (section.roles === 'all' || section.roles.some((role) => known.includes(role))) &&
      (section.module === undefined || activeModules.includes(section.module)),
  )
}

/** Las secciones agrupadas en sus bloques, en orden y sin bloques vacíos. */
export function groupSections(sections: readonly MenuSection[]): { group: MenuGroup; title: string | null; sections: MenuSection[] }[] {
  return (['daily', 'admin', 'footer'] as const)
    .map((group) => ({ group, title: menuGroupTitles[group], sections: sections.filter((s) => s.group === group) }))
    .filter((block) => block.sections.length > 0)
}
