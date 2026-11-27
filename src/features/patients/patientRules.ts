import { displayTimeZone } from '../../lib/dates'

/** Tipos de documento (catálogo cerrado; coincide con el check de la base). */
export const documentTypes = ['dni', 'passport', 'other'] as const
export type DocumentType = (typeof documentTypes)[number]

export const documentTypeLabels: Record<DocumentType, string> = {
  dni: 'DNI',
  passport: 'Pasaporte',
  other: 'Otro',
}

export function documentTypeLabel(value: string): string {
  return (documentTypes as readonly string[]).includes(value) ? documentTypeLabels[value as DocumentType] : value
}

export const registeredSexes = ['F', 'M', 'X'] as const
export type RegisteredSex = (typeof registeredSexes)[number]

/**
 * Número de documento sin puntos, guiones ni espacios, en mayúsculas.
 * Igual que private.normalize_document en la base: "30.123.456" = "30123456".
 */
export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}

/** Fecha de hoy en Mendoza, como "AAAA-MM-DD". */
export function todayInMendoza(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: displayTimeZone }).format(now)
}

/** Edad en años cumplidos. La edad no se guarda: se calcula (flujo 01). */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number]
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number]
  const hadBirthday = tm > bm || (tm === bm && td >= bd)
  return ty - by - (hadBirthday ? 0 : 1)
}

/** "14/03/1998" a partir de "1998-03-14", sin pasar por zonas horarias. */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

interface NamedPatient {
  first_name: string
  last_name: string
  chosen_name: string | null
}

/**
 * Nombre con el que se muestra a la persona: el nombre elegido si está cargado (Ley 26.743),
 * si no, el del documento.
 */
export function displayName(patient: NamedPatient): string {
  return `${patient.chosen_name ?? patient.first_name} ${patient.last_name}`
}

/** Para listas ordenadas por apellido: "Núñez, Vale". */
export function listName(patient: NamedPatient): string {
  return `${patient.last_name}, ${patient.chosen_name ?? patient.first_name}`
}
