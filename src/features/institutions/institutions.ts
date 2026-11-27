/**
 * Instituciones de la persona y cuál eligió. Funciones sin pantalla, para poder testearlas.
 */

export interface MyRole {
  code: string
  name: string
}

export interface MyInstitution {
  id: string
  name: string
  roles: MyRole[]
  /** Códigos de los módulos activos (ADR 0003). La Base no figura: está siempre activa. */
  modules: string[]
}

/** Una fila de `membership` con su institución y su rol, como la devuelve Supabase. */
export interface MembershipRow {
  institution: { id: string; name: string } | null
  role: { code: string; name: string; sort_order: number } | null
}

/** Una fila de `institution_module` activa, con el código del módulo. */
export interface ModuleRow {
  institution_id: string
  module: { code: string } | null
}

/**
 * Junta las membresías por institución (una persona tiene una fila por rol) y les suma sus módulos.
 * Si RLS no deja ver la institución (por ejemplo, porque fue dada de baja), la fila se descarta.
 */
export function groupMemberships(rows: readonly MembershipRow[], moduleRows: readonly ModuleRow[] = []): MyInstitution[] {
  const byId = new Map<string, { id: string; name: string; roles: MembershipRow['role'][] }>()
  for (const row of rows) {
    if (row.institution === null || row.role === null) continue
    const entry = byId.get(row.institution.id) ?? { ...row.institution, roles: [] }
    entry.roles.push(row.role)
    byId.set(row.institution.id, entry)
  }
  return [...byId.values()]
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      roles: entry.roles
        .filter((role) => role !== null)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ code, name }) => ({ code, name })),
      modules: moduleRows
        .filter((row) => row.institution_id === entry.id && row.module !== null)
        .map((row) => row.module!.code)
        .sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/**
 * Identificador de la sesión de Supabase, sacado del token. No cambia cuando el token se renueva,
 * pero sí cada vez que la persona vuelve a entrar. Sirve para pedir que elija institución en cada ingreso.
 */
export function sessionIdFromToken(accessToken: string): string | null {
  const payload = accessToken.split('.')[1]
  if (payload === undefined) return null
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims: unknown = JSON.parse(json)
    if (typeof claims === 'object' && claims !== null && 'session_id' in claims && typeof claims.session_id === 'string') {
      return claims.session_id
    }
    return null
  } catch {
    return null
  }
}

export const institutionStorageKey = 'ronda.institucion'

/** La institución guardada vale solo para la misma sesión. */
export function parseStoredInstitution(raw: string | null, sessionId: string | null): string | null {
  if (raw === null || sessionId === null) return null
  try {
    const stored: unknown = JSON.parse(raw)
    if (
      typeof stored === 'object' &&
      stored !== null &&
      'sessionId' in stored &&
      'institutionId' in stored &&
      stored.sessionId === sessionId &&
      typeof stored.institutionId === 'string'
    ) {
      return stored.institutionId
    }
    return null
  } catch {
    return null
  }
}

export function serializeStoredInstitution(sessionId: string, institutionId: string): string {
  return JSON.stringify({ sessionId, institutionId })
}
