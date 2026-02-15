import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'
import { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/register', async (c) => {
    const { email, password } = await c.req.json()

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400)
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
    const { email, password } = await c.req.json()

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400)
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
