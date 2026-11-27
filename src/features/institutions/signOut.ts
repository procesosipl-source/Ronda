import { supabase } from '../../lib/supabase'
import { institutionStorageKey } from './institutions'

/**
 * Sale de Ronda: registra la salida en la auditoría de la institución activa y cierra la sesión
 * en este dispositivo. Si el registro falla (por ejemplo, sin conexión), igual se sale.
 */
export async function signOut(institutionId: string | null): Promise<void> {
  if (institutionId !== null) {
    await supabase.rpc('leave_institution', { p_institution_id: institutionId }).then(
      () => undefined,
      () => undefined,
    )
  }
  localStorage.removeItem(institutionStorageKey)
  await supabase.auth.signOut({ scope: 'local' })
}
