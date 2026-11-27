// Edge Function: invitar a una persona a una institución (flujo 21).
//
// Por qué existe: mandar el mail de invitación de Supabase Auth requiere la clave secreta,
// que nunca puede estar en el navegador (regla 4). Esta función corre en el servidor de
// Supabase, que le da la clave como variable de entorno; no está en el repositorio.
//
// Quién decide: la base. La función primero llama a invite_member con la sesión de quien
// invita; si la base dice que no es Dirección, no se manda nada. La clave secreta se usa
// solo para mandar el mail, y la membresía la crea otra vez invite_member con esa sesión.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InviteRequest {
  institutionId: string
  email: string
  fullName: string
  roleCodes: string[]
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseRequest(value: unknown): InviteRequest | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (
    typeof v.institutionId !== 'string' ||
    typeof v.email !== 'string' ||
    typeof v.fullName !== 'string' ||
    !Array.isArray(v.roleCodes) ||
    !v.roleCodes.every((code) => typeof code === 'string')
  ) {
    return null
  }
  return { institutionId: v.institutionId, email: v.email, fullName: v.fullName, roleCodes: v.roleCodes as string[] }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Pedido no válido.' }, 405)

  const authorization = req.headers.get('Authorization')
  if (authorization === null) return json({ error: 'Tenés que iniciar sesión.' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return json({ error: 'El servidor no está bien configurado.' }, 500)

  const request = parseRequest(await req.json().catch(() => null))
  if (request === null) return json({ error: 'Faltan datos de la invitación.' }, 400)

  // Cliente con la sesión de quien invita: todo lo que hace pasa por RLS y por las funciones de la base.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })

  const inviteMember = () =>
    asCaller.rpc('invite_member', {
      p_institution_id: request.institutionId,
      p_email: request.email,
      p_full_name: request.fullName,
      p_role_codes: request.roleCodes,
    })

  const first = await inviteMember()
  if (first.error !== null) {
    // P0001 son los mensajes escritos para la persona (por ejemplo, "Escribí el nombre y apellido.").
    const message = first.error.code === 'P0001' ? first.error.message : 'No pudimos mandar la invitación. Probá de nuevo.'
    return json({ error: message }, 400)
  }
  if (first.data === 'denied') return json({ error: 'No tenés permiso para invitar personas en esta institución.' }, 403)
  if (first.data === 'added') return json({ status: 'added' })

  // 'needs_invite': la persona no tiene usuario. Se le manda el mail con la clave secreta.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const origin = req.headers.get('Origin')
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(request.email.trim().toLowerCase(), {
    data: { full_name: request.fullName.trim() },
    // Supabase solo acepta direcciones de la lista permitida; si no, usa la del sitio.
    redirectTo: origin === null ? undefined : `${origin}/nueva-contrasena?invitacion=1`,
  })
  if (inviteError !== null) {
    if (inviteError.status === 429) {
      return json({ error: 'Se mandaron muchas invitaciones en poco tiempo. Probá de nuevo en una hora.' }, 429)
    }
    console.error('inviteUserByEmail', inviteError.message)
    return json({ error: 'No pudimos mandar el mail de invitación. Probá de nuevo.' }, 502)
  }

  const second = await inviteMember()
  if (second.error !== null || second.data !== 'added') {
    console.error('invite_member después del mail', second.error?.message, second.data)
    return json({ error: 'Mandamos el mail, pero no pudimos sumar a la persona. Probá invitarla de nuevo.' }, 500)
  }
  return json({ status: 'invited' })
})
