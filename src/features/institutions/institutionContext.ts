import { createContext, useContext } from 'react'
import type { MyInstitution } from './institutions'

export interface InstitutionContextValue {
  /** Institución en la que la persona está trabajando. */
  current: MyInstitution
  /** Todas las instituciones donde tiene una membresía activa. */
  all: MyInstitution[]
  /** Pasa a otra institución. Devuelve false si la base no la deja entrar. */
  switchTo: (institutionId: string) => Promise<boolean>
}

export const InstitutionContext = createContext<InstitutionContextValue | null>(null)

/** Institución activa. Solo se usa dentro de InstitutionGate. */
export function useInstitution(): InstitutionContextValue {
  const value = useContext(InstitutionContext)
  if (value === null) throw new Error('useInstitution se usa solo dentro de InstitutionGate')
  return value
}
