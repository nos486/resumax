import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { Bindings, Variables } from './types'

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
    async (c, next) => {
        const authHeader = c.req.header('Authorization')
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const token = authHeader.split(' ')[1]
        if (!token) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        try {
            const payload = await verify(token, c.env.JWT_SECRET)
            c.set('user', payload as unknown as Variables['user']) // Type assertion
            await next()
        } catch (e) {
            return c.json({ error: 'Unauthorized' }, 401)
        }
    }
)
