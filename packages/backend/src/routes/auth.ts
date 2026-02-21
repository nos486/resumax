import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

// Shared helper to issue a JWT for a user
async function issueToken(userId: number, email: string, jwtSecret: string) {
    return sign({
        id: userId,
        email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }, jwtSecret)
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

// Step 2: Handle Google callback — exchange code for user info, find-or-create account
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

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
        console.error('Google token exchange failed:', tokenData)
        return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to exchange token with Google')}`)
    }

    // Fetch user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = await userInfoRes.json() as { sub?: string; email?: string; name?: string }

    if (!googleUser.email || !googleUser.sub) {
        return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Could not retrieve user info from Google')}`)
    }

    // Find or create user
    let user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE google_id = ? OR email = ?'
    ).bind(googleUser.sub, googleUser.email).first<{ id: number; email: string; google_id: string | null }>()

    if (!user) {
        // First-time Google login — create account
        const insertResult = await c.env.DB.prepare(
            'INSERT INTO users (email, google_id) VALUES (?, ?) RETURNING *'
        ).bind(googleUser.email, googleUser.sub).first<{ id: number; email: string }>()

        if (!insertResult) {
            return c.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to create account')}`)
        }
        user = { ...insertResult, google_id: googleUser.sub }
    } else if (!user.google_id) {
        // Existing account — link Google ID
        await c.env.DB.prepare(
            'UPDATE users SET google_id = ? WHERE id = ?'
        ).bind(googleUser.sub, user.id).run()
    }

    const token = await issueToken(user.id, user.email, c.env.JWT_SECRET)
    const userParam = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email }))

    return c.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userParam}`)
})

export default auth
