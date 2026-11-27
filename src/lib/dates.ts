/** Zona horaria en la que se muestran las fechas (CLAUDE.md, "Fechas"). En la base se guardan en UTC. */
export const displayTimeZone = 'America/Argentina/Mendoza'

const dateTimeFormat = new Intl.DateTimeFormat('es-AR', {
  timeZone: displayTimeZone,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // con hour12: false algunos navegadores muestran la medianoche como 24:00
})

/** "27/11/2026 14:05", en hora de Argentina. */
export function formatDateTime(value: string | Date): string {
  const parts = Object.fromEntries(
    dateTimeFormat.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}
