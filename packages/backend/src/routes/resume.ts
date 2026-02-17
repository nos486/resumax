import { Hono } from 'hono'
import { Bindings, Variables } from '../types'
import { authMiddleware } from '../middleware'

const resume = new Hono<{ Bindings: Bindings; Variables: Variables }>()

resume.use('*', authMiddleware)

resume.get('/', async (c) => {
    const user = c.get('user')
    const resume = await c.env.DB.prepare(
        'SELECT * FROM resumes WHERE user_id = ?'
    ).bind(user.id).first()

    if (!resume) {
        return c.json({ message: 'Resume not found', data: null })
    }

    try {
        if (typeof resume.content === 'string') {
            resume.content = JSON.parse(resume.content)
        }
    } catch (e) { }

    return c.json(resume)
})

resume.put('/', async (c) => {
    const user = c.get('user')
    const { content, theme, slug } = await c.req.json()

    const existing = await c.env.DB.prepare(
        'SELECT id FROM resumes WHERE user_id = ?'
    ).bind(user.id).first()

    const contentJson = JSON.stringify(content || {})

    let result
    if (existing) {
        result = await c.env.DB.prepare(
            'UPDATE resumes SET content = ?, theme = ?, slug = ?, updated_at = unixepoch() WHERE user_id = ?'
        ).bind(contentJson, theme, slug, user.id).run()
    } else {
        const slugCheck = await c.env.DB.prepare(
            'SELECT id FROM resumes WHERE slug = ?'
        ).bind(slug).first()

        if (slugCheck) {
            return c.json({ error: 'Slug already taken' }, 409)
        }

        result = await c.env.DB.prepare(
            'INSERT INTO resumes (user_id, slug, content, theme) VALUES (?, ?, ?, ?)'
        ).bind(user.id, slug, contentJson, theme || 'modern').run()
    }

    if (!result.success) {
        return c.json({ error: 'Failed to save resume' }, 500)
    }

    return c.json({ message: 'Resume saved successfully' })
})

export default resume
