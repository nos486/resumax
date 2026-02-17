import { Hono } from 'hono'
import { Bindings } from '../types'

const publicRoute = new Hono<{ Bindings: Bindings }>()

publicRoute.get('/:slug', async (c) => {
    const slug = c.req.param('slug')

    const resume = await c.env.DB.prepare(
        'SELECT content, customization, theme, slug, updated_at FROM resumes WHERE slug = ?'
    ).bind(slug).first()

    if (!resume) {
        return c.json({ error: 'Resume not found' }, 404)
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

export default publicRoute
