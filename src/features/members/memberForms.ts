import { z } from 'zod'
import { roleCodes } from '../navigation/menu'

/**
 * Formularios de la pantalla de Usuarios. Validan en la pantalla para avisar rápido;
 * la base vuelve a validar todo (regla 3).
 */

const roleCodesField = z.array(z.enum(roleCodes)).min(1, { message: 'Elegí al menos un rol.' })

const reasonField = (message: string) => z.string().trim().min(1, { message })

export const inviteSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Escribí el nombre y apellido.' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Escribí el email.' })
    .pipe(z.email({ message: 'Revisá el email: parece que le falta algo.' })),
  roleCodes: roleCodesField,
})
export type InviteValues = z.infer<typeof inviteSchema>

export const changeRolesSchema = z.object({
  roleCodes: roleCodesField,
  reason: reasonField('Escribí el motivo del cambio.'),
})
export type ChangeRolesValues = z.infer<typeof changeRolesSchema>

export const deactivateSchema = z.object({
  reason: reasonField('Escribí el motivo de la baja.'),
})
export type DeactivateValues = z.infer<typeof deactivateSchema>
