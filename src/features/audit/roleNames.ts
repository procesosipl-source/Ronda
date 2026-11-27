import { isRoleCode, type RoleCode } from '../navigation/menu'

const names: Record<RoleCode, string> = {
  director: 'Dirección',
  coordinator: 'Coordinación',
  administration: 'Administración',
  reception: 'Recepción',
  professional: 'Profesional',
  nursing: 'Enfermería',
}

/**
 * Nombres de los roles guardados en la auditoría. La auditoría guarda los códigos tal como
 * estaban en ese momento, así que se traducen acá en lugar de buscarlos en la base.
 */
export function roleNames(codes: readonly string[]): string {
  return codes.map((code) => (isRoleCode(code) ? names[code] : code)).join(' · ')
}
