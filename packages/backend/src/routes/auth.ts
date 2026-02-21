import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'
import { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

async function verifyTurnstile(token: string, secretKey: string) {
    if (!token) return false;
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
        body: formData,
        method: 'POST',
    });
    const outcome = await result.json() as { success: boolean };
    return outcome.success;
}

auth.post('/register', async (c) => {
    const { email, password, captchaToken } = await c.req.json()

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400)
    }

    // Verify Captcha
    if (c.env.TURNSTILE_SECRET_KEY) {
        const isValid = await verifyTurnstile(captchaToken, c.env.TURNSTILE_SECRET_KEY);
        if (!isValid) {
            return c.json({ error: 'Invalid captcha token' }, 403)
        }
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
        return c.json({ error: 'User already exists' }, 409)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user
    const result = await c.env.DB.prepare(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).bind(email, passwordHash).run()

    if (!result.success) {
        return c.json({ error: 'Failed to create user' }, 500)
    }

    return c.json({ message: 'User created successfully' }, 201)
})

auth.post('/login', async (c) => {
    const { email, password, captchaToken } = await c.req.json()

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400)
    }

    // Verify Captcha
    if (c.env.TURNSTILE_SECRET_KEY) {
        const isValid = await verifyTurnstile(captchaToken, c.env.TURNSTILE_SECRET_KEY);
        if (!isValid) {
            return c.json({ error: 'Invalid captcha token' }, 403)
        }
    }

    if (!c.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set')
        return c.json({ error: 'Server misconfiguration: JWT_SECRET missing' }, 500)
    }


    const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
    ).bind(email).first<{ id: number; email: string; password_hash: string }>()

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return c.json({ error: 'Invalid email or password' }, 401)
    }

    const token = await sign({
        id: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }, c.env.JWT_SECRET)

    return c.json({ token, user: { id: user.id, email: user.email } })
})

auth.get('/google', async (c) => {
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.FRONTEND_URL) {
        return c.json({ error: 'Server misconfiguration: Google OAuth missing' }, 500)
    }

    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`
    const scope = 'email profile'
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${c.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=online`

    return c.redirect(oauthUrl)
})

auth.get('/google/callback', async (c) => {
    const code = c.req.query('code')
    if (!code) {
        return c.json({ error: 'No code provided' }, 400)
    }

    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET || !c.env.FRONTEND_URL || !c.env.JWT_SECRET) {
        return c.json({ error: 'Server misconfiguration' }, 500)
    }

    const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`

    try {
        // Exchange code for token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: c.env.GOOGLE_CLIENT_ID,
                client_secret: c.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        })

        const tokenData = await tokenRes.json() as { access_token?: string, error?: string }

        if (tokenData.error || !tokenData.access_token) {
            return c.json({ error: 'Failed to exchange token' }, 400)
        }

        // Fetch user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        })

        const userData = await userRes.json() as { email?: string, id?: string }

        if (!userData.email) {
            return c.json({ error: 'Failed to retrieve email from Google' }, 400)
        }

        const email = userData.email

        // Check user exists
        let user = await c.env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first<{ id: number; email: string; password_hash: string }>()

        if (!user) {
            // Create user with dummy password hash for OAuth users
            const passwordHash = await bcrypt.hash(Math.random().toString(36) + Math.random().toString(36), 10)
            const result = await c.env.DB.prepare(
                'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email'
            ).bind(email, passwordHash).first<{ id: number; email: string }>()

            if (!result) {
                return c.json({ error: 'Failed to create user' }, 500)
            }
            user = { id: result.id, email: result.email, password_hash: passwordHash }
        }

        const token = await sign({
            id: user.id,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        }, c.env.JWT_SECRET)

        // Redirect to frontend with token
        return c.redirect(`${c.env.FRONTEND_URL}/login?token=${token}&email=${encodeURIComponent(user.email)}&id=${user.id}`)

    } catch (e) {
        console.error('OAuth error:', e)
        return c.json({ error: 'Authentication failed' }, 500)
    }
})

export default auth
