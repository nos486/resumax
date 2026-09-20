import { Context } from 'hono'
import { sign } from 'hono/jwt'
import { AuthUser } from '@resumax/shared'
import { Bindings } from './types'

export const ACCESS_COOKIE_NAME = 'resumax_access'
export const REFRESH_COOKIE_NAME = 'resumax_refresh'
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Hash a token string using SHA-256 via the Web Crypto API.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a cryptographically secure random token string.
 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Issues a short-lived access JWT (15 min).
 */
export async function issueAccessToken(user: AuthUser, jwtSecret: string): Promise<string> {
  return sign(
    {
      id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE,
    },
    jwtSecret
  )
}

/**
 * Constructs cookie options tailored for local dev and edge production.
 */
export function getCookieOptions(c: Context<any>, maxAge: number) {
  const origin = c.req.header('origin') || ''
  const isSecure = c.req.url.startsWith('https://') || origin.startsWith('https://')
  
  // If cross-origin over HTTPS (e.g. Pages to Workers), sameSite must be 'None' for credentialed cookies
  let isCrossSite = false
  try {
    if (origin) {
      const originHost = new URL(origin).host
      const reqHost = new URL(c.req.url).host
      isCrossSite = originHost !== reqHost
    }
  } catch {
    // fallback
  }

  const cookieDomain = c.env.COOKIE_DOMAIN || undefined

  return {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: (isCrossSite && isSecure ? 'None' : 'Lax') as 'None' | 'Lax',
    maxAge,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }
}
