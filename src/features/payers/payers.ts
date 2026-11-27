import { z } from 'zod'
import { supabase } from '../../lib/supabase'

/** Tipos de financiador (lista cerrada; coincide con el check de la base). */
export const payerKinds = ['social_security', 'prepaid', 'private'] as const
export type PayerKind = (typeof payerKinds)[number]

export const payerKindLabels: Record<PayerKind, string> = {
  social_security: 'Obra social',
  prepaid: 'Prepaga',
  private: 'Particular',
}

export function payerKindLabel(value: string): string {
  return (payerKinds as readonly string[]).includes(value) ? payerKindLabels[value as PayerKind] : value
}

/** Roles que mantienen el catálogo. Coincide con las políticas de `payer` en la base. */
export const payerEditorRoles = ['director', 'administration']

export const payerSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'Escribí el nombre.' }),
    kind: z.enum(payerKinds, { message: 'Elegí el tipo.' }),
    requiresMemberNumber: z.boolean(),
    nationalCode: z.string().trim(),
  })
  // Particular no tiene número de afiliado (flujo 01). La base tiene la misma regla.
  .transform((values) => (values.kind === 'private' ? { ...values, requiresMemberNumber: false } : values))
export type PayerValues = z.input<typeof payerSchema>

export class PayerError extends Error {}

/** Obras sociales activas de la institución, ordenadas por nombre. */
export async function listPayers(institutionId: string) {
  const { data, error } = await supabase
    .from('payer')
    .select('id, name, kind, requires_member_number, national_code')
    .eq('institution_id', institutionId)
    .is('deleted_at', null)
    .order('name')
  if (error !== null) throw new PayerError('No pudimos cargar las obras sociales. Revisá tu conexión y volvé a intentar.')
  return data
}
export type Payer = Awaited<ReturnType<typeof listPayers>>[number]

function payerError(code: string | undefined): PayerError {
  if (code === '23505') return new PayerError('Ya hay una obra social con ese nombre.')
  if (code === '42501') return new PayerError('No tenés permiso para cambiar las obras sociales.')
  return new PayerError('No pudimos guardar el cambio. Revisá tu conexión y volvé a intentar.')
}

export async function savePayer(institutionId: string, values: PayerValues, payerId?: string) {
  const parsed = payerSchema.parse(values)
  const row = {
    name: parsed.name,
    kind: parsed.kind,
    requires_member_number: parsed.requiresMemberNumber,
    national_code: parsed.nationalCode === '' ? null : parsed.nationalCode,
  }
  const { error } =
    payerId === undefined
      ? await supabase.from('payer').insert({ ...row, institution_id: institutionId })
      : await supabase.from('payer').update(row).eq('institution_id', institutionId).eq('id', payerId)
  if (error !== null) throw payerError(error.code)
}

/** Dar de baja: deja de aparecer para coberturas nuevas; las que ya existen no cambian. */
export async function deactivatePayer(institutionId: string, payerId: string) {
  const { error } = await supabase
    .from('payer')
    .update({ deleted_at: new Date().toISOString() })
    .eq('institution_id', institutionId)
    .eq('id', payerId)
  if (error !== null) throw payerError(error.code)
}
