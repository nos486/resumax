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

export default auth
