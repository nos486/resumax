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
        if (typeof resume.customization === 'string') {
            resume.customization = JSON.parse(resume.customization)
        } else if (!resume.customization) {
            resume.customization = {}
        }
    } catch (e) { }

    return c.json(resume)
})

resume.put('/', async (c) => {
    const user = c.get('user')
    const { content, theme, slug, customization } = await c.req.json()

    const existing = await c.env.DB.prepare(
        'SELECT id FROM resumes WHERE user_id = ?'
    ).bind(user.id).first()

    const contentJson = JSON.stringify(content || {})
    const customizationJson = JSON.stringify(customization || {})

    let result
    if (existing) {
        result = await c.env.DB.prepare(
            'UPDATE resumes SET content = ?, customization = ?, theme = ?, slug = ?, updated_at = unixepoch() WHERE user_id = ?'
        ).bind(contentJson, customizationJson, theme, slug, user.id).run()
    } else {
        const slugCheck = await c.env.DB.prepare(
            'SELECT id FROM resumes WHERE slug = ?'
        ).bind(slug).first()

        if (slugCheck) {
            return c.json({ error: 'Slug already taken' }, 409)
        }

        result = await c.env.DB.prepare(
            'INSERT INTO resumes (user_id, slug, content, customization, theme) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.id, slug, contentJson, customizationJson, theme || 'modern').run()
    }

    if (!result.success) {
        return c.json({ error: 'Failed to save resume' }, 500)
    }

    return c.json({ message: 'Resume saved successfully' })
})

export default resume
