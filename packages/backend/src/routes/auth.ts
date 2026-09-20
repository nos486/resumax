import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { Bindings, Variables } from '../types'
import { authMiddleware } from '../middleware'
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  generateSecureToken,
  hashToken,
  issueAccessToken,
  getCookieOptions,
} from '../auth-utils'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Helper to check if an email matches the configured admin emails
function isConfiguredAdmin(email: string, adminEmailsConfig?: string): boolean {
  if (!adminEmailsConfig || !email) return false
  const adminList = adminEmailsConfig
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminList.includes(email.trim().toLowerCase())
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google consent page
auth.get('/google', async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: 'Google OAuth is not configured' }, 500)
  }

  const redirectUri = new URL('/api/auth/google/callback', new URL(c.req.url).origin).toString()

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

// Step 2: Handle Google callback — exchange code, verify admin status, issue cookies
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173'

  if (error || !code) {
    return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error || 'No code returned')}`)
  }

  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.JWT_SECRET) {
    return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Server misconfiguration')}`)
  }

  const redirectUri = new URL('/api/auth/google/callback', new URL(c.req.url).origin).toString()

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }

  if (!tokenData.access_token) {
    return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to exchange token with Google')}`)
  }

  // Fetch user profile from Google
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const googleUser = (await userInfoRes.json()) as { sub?: string; email?: string; name?: string }

  if (!googleUser.email || !googleUser.sub) {
    return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Could not retrieve user info from Google')}`)
  }

  const shouldBeAdmin = isConfiguredAdmin(googleUser.email, c.env.ADMIN_EMAILS)

  // Find or create user in D1
  let user = await c.env.DB.prepare(
    'SELECT id, email, google_id, is_admin FROM users WHERE google_id = ? OR email = ?'
  )
    .bind(googleUser.sub, googleUser.email)
    .first<{ id: number; email: string; google_id: string | null; is_admin: number }>()

  if (!user) {
    const insertResult = await c.env.DB.prepare(
      'INSERT INTO users (email, google_id, is_admin) VALUES (?, ?, ?) RETURNING id, email, google_id, is_admin'
    )
      .bind(googleUser.email, googleUser.sub, shouldBeAdmin ? 1 : 0)
      .first<{ id: number; email: string; google_id: string | null; is_admin: number }>()

    if (!insertResult) {
      return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to create user account')}`)
    }
    user = insertResult
  } else {
    // If user's google_id is missing or admin role needs promotion
    let needsUpdate = false
    let updatedGoogleId = user.google_id || googleUser.sub
    let updatedIsAdmin = user.is_admin

    if (!user.google_id) {
      needsUpdate = true
    }

    if (shouldBeAdmin && !user.is_admin) {
      updatedIsAdmin = 1
      needsUpdate = true
    }

    if (needsUpdate) {
      await c.env.DB.prepare('UPDATE users SET google_id = ?, is_admin = ? WHERE id = ?')
        .bind(updatedGoogleId, updatedIsAdmin, user.id)
        .run()
      user = { ...user, google_id: updatedGoogleId, is_admin: updatedIsAdmin }
    }
  }

  // ─── Dual-token creation ──────────────────────────────────────────────────
  const accessToken = await issueAccessToken(
    { id: user.id, email: user.email, is_admin: Boolean(user.is_admin) },
    c.env.JWT_SECRET
  )
  const refreshToken = generateSecureToken()
  const hashedRefreshToken = await hashToken(refreshToken)
  const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE

  // Save hashed refresh token to D1
  await c.env.DB.prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  )
    .bind(user.id, hashedRefreshToken, expiresAt)
    .run()

  // Set httpOnly session cookies
  setCookie(c, ACCESS_COOKIE_NAME, accessToken, getCookieOptions(c, ACCESS_TOKEN_MAX_AGE))
  setCookie(c, REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(c, REFRESH_TOKEN_MAX_AGE))

  return c.redirect(`${frontendUrl}/auth/callback?success=true`)
})

// ─── Refresh Token Endpoint ─────────────────────────────────────────────────

auth.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)

  if (!refreshToken) {
    return c.json({ error: 'No refresh token provided', code: 'NO_REFRESH_TOKEN' }, 401)
  }

  const hashedToken = await hashToken(refreshToken)
  const now = Math.floor(Date.now() / 1000)

  // Find valid, non-expired refresh token in D1
  const storedToken = await c.env.DB.prepare(
    'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = ? AND expires_at > ?'
  )
    .bind(hashedToken, now)
    .first<{ id: number; user_id: number; expires_at: number }>()

  if (!storedToken) {
    deleteCookie(c, ACCESS_COOKIE_NAME, { path: '/' })
    deleteCookie(c, REFRESH_COOKIE_NAME, { path: '/' })
    return c.json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' }, 401)
  }

  // Fetch associated user including is_admin flag
  const user = await c.env.DB.prepare('SELECT id, email, is_admin FROM users WHERE id = ?')
    .bind(storedToken.user_id)
    .first<{ id: number; email: string; is_admin: number }>()

  if (!user) {
    deleteCookie(c, ACCESS_COOKIE_NAME, { path: '/' })
    deleteCookie(c, REFRESH_COOKIE_NAME, { path: '/' })
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 401)
  }

  // Token rotation: generate new refresh token and invalidate old one
  const newRefreshToken = generateSecureToken()
  const newHashedToken = await hashToken(newRefreshToken)
  const newExpiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE

  await c.env.DB.prepare(
    'UPDATE refresh_tokens SET token_hash = ?, expires_at = ? WHERE id = ?'
  )
    .bind(newHashedToken, newExpiresAt, storedToken.id)
    .run()

  // Issue new access token with is_admin
  const newAccessToken = await issueAccessToken(
    { id: user.id, email: user.email, is_admin: Boolean(user.is_admin) },
    c.env.JWT_SECRET
  )

  // Set updated cookies
  setCookie(c, ACCESS_COOKIE_NAME, newAccessToken, getCookieOptions(c, ACCESS_TOKEN_MAX_AGE))
  setCookie(c, REFRESH_COOKIE_NAME, newRefreshToken, getCookieOptions(c, REFRESH_TOKEN_MAX_AGE))

  return c.json({
    success: true,
    user: { id: user.id, email: user.email, is_admin: Boolean(user.is_admin) },
  })
})

// ─── Logout Endpoint ────────────────────────────────────────────────────────

auth.post('/logout', async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME)

  if (refreshToken) {
    try {
      const hashedToken = await hashToken(refreshToken)
      await c.env.DB.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?')
        .bind(hashedToken)
        .run()
    } catch (e) {
      console.error('Error invalidating refresh token on logout:', e)
    }
  }

  deleteCookie(c, ACCESS_COOKIE_NAME, { path: '/' })
  deleteCookie(c, REFRESH_COOKIE_NAME, { path: '/' })

  return c.json({ success: true, message: 'Logged out successfully' })
})

// ─── Current User Endpoint ──────────────────────────────────────────────────

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

export default auth
