import { describe, expect, it } from 'vitest'
import { isSecretKey, parseEnv } from './env'

/** Arma un JWT de mentira con el rol pedido, como las claves viejas de Supabase. */
function fakeJwt(role: string): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode({ role })}.firma`
}

const validEnv = {
  VITE_SUPABASE_URL: 'https://ejemplo.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ejemplo',
}

describe('parseEnv', () => {
  it('acepta una URL y una clave publicable', () => {
    expect(parseEnv(validEnv)).toEqual(validEnv)
  })

  it('avisa qué falta cuando no hay configuración', () => {
    expect(() => parseEnv({})).toThrow(/Revisá \.env\.local/)
  })

  it('rechaza una clave secreta nueva (sb_secret_)', () => {
    expect(() =>
      parseEnv({ ...validEnv, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_ejemplo' }),
    ).toThrow(/clave secreta/)
  })

  it('rechaza una clave vieja con rol service_role', () => {
    expect(() =>
      parseEnv({ ...validEnv, VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt('service_role') }),
    ).toThrow(/clave secreta/)
  })
})

describe('isSecretKey', () => {
  it('no confunde la clave anon vieja con una secreta', () => {
    expect(isSecretKey(fakeJwt('anon'))).toBe(false)
  })

  it('no falla con texto que no es un JWT', () => {
    expect(isSecretKey('a.%%%.c')).toBe(false)
  })
})
