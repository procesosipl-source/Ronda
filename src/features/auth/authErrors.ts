/** Lo que nos importa de un error de Supabase Auth (AuthError). */
export interface AuthErrorLike {
  code?: string | undefined
  status?: number | undefined
  name?: string | undefined
}

const messagesByCode: Record<string, string> = {
  invalid_credentials: 'El email o la contraseña no coinciden.',
  email_not_confirmed: 'Tu cuenta todavía no está confirmada. Revisá tu mail.',
  user_banned: 'Tu cuenta está suspendida. Hablá con la Dirección de tu institución.',
  over_request_rate_limit: 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.',
  over_email_send_rate_limit: 'Pediste muchos enlaces seguidos. Esperá unos minutos y probá de nuevo.',
  weak_password: 'La contraseña es fácil de adivinar. Probá con una más larga o distinta.',
  same_password: 'La contraseña nueva tiene que ser distinta de la anterior.',
  session_not_found: 'Tu sesión venció. Ingresá de nuevo.',
}

/** Traduce un error de Supabase Auth a un mensaje para la persona, sin tecnicismos. */
export function authErrorMessage(error: AuthErrorLike): string {
  if (error.code !== undefined && error.code in messagesByCode) {
    return messagesByCode[error.code] as string
  }
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.'
  }
  return 'Algo salió mal. Probá de nuevo en unos minutos.'
}
