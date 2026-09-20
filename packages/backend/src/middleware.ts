import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'
import { Bindings, Variables } from './types'
import { ACCESS_COOKIE_NAME } from './auth-utils'

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
    async (c, next) => {
        let token = getCookie(c, ACCESS_COOKIE_NAME)

        // Fallback to Authorization: Bearer <token> for CLI/test tooling
        if (!token) {
            const authHeader = c.req.header('Authorization')
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7)
            }
        }

        if (!token) {
            return c.json({ error: 'Unauthorized: No session token provided', code: 'UNAUTHORIZED' }, 401)
        }

        if (!c.env.JWT_SECRET) {
            console.error('SERVER ERROR: JWT_SECRET is not configured')
            return c.json({ error: 'Server configuration error' }, 500)
        }

        try {
            const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as { id: number; email: string }
            c.set('user', { id: payload.id, email: payload.email })
            await next()
        } catch (e: any) {
            return c.json({
                error: 'Unauthorized: Session expired or invalid',
                code: 'TOKEN_EXPIRED',
                details: e.message,
            }, 401)
        }
    }
)
