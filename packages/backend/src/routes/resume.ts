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
        // Generate random 6-character slug
        const randomSlug = Math.random().toString(36).substring(2, 8)

        // Check uniqueness just in case (optional but good practice)
        let uniqueSlug = randomSlug
        let isUnique = false
        while (!isUnique) {
            const check = await c.env.DB.prepare('SELECT id FROM resumes WHERE slug = ?').bind(uniqueSlug).first()
            if (!check) {
                isUnique = true
            } else {
                uniqueSlug = Math.random().toString(36).substring(2, 8)
            }
        }

        const insertResult = await c.env.DB.prepare(
            "INSERT INTO resumes (user_id, slug, content, theme) VALUES (?, ?, '{}', 'modern') RETURNING *"
        ).bind(user.id, uniqueSlug).first()

        if (!insertResult) {
            return c.json({ error: 'Failed to initialize resume' }, 500)
        }

        return c.json(insertResult)
    }

    // Parse content if it's a string, or it might be returned as JSON if stored as JSON type in D1 (but schema says TEXT)
    // SQLite stores JSON as TEXT, so implementation needs to parse it if needed, or just return as is if client handles parsing?
    // Hono D1 binding usually returns as is. Better to valid JSON parse it just in case.
    try {
        if (typeof resume.content === 'string') {
            resume.content = JSON.parse(resume.content)
        }
    } catch (e) { }

    return c.json(resume)
})

resume.put('/', async (c) => {
    const user = c.get('user')
    let { content, theme, slug } = await c.req.json()

    // Auto-generate slug if cleared/empty
    if (!slug || slug.trim() === '') {
        const randomSlug = Math.random().toString(36).substring(2, 8)

        let uniqueSlug = randomSlug
        let isUnique = false
        while (!isUnique) {
            const check = await c.env.DB.prepare('SELECT id FROM resumes WHERE slug = ?').bind(uniqueSlug).first()
            if (!check) {
                isUnique = true
            } else {
                uniqueSlug = Math.random().toString(36).substring(2, 8)
            }
        }
        slug = uniqueSlug
    }

    // Slug validation: min 4 characters
    if (slug.length < 4) {
        return c.json({ error: 'Slug must be at least 4 characters long' }, 400)
    }

    // Validate slug uniqueness if changed?
    // For simplicity, slug is set once or updated.
    // If resume doesn't exist, create it.

    const existing = await c.env.DB.prepare(
        'SELECT id FROM resumes WHERE user_id = ?'
    ).bind(user.id).first()

    let result
    if (existing) {
        result = await c.env.DB.prepare(
            'UPDATE resumes SET content = ?, theme = ?, slug = ?, updated_at = unixepoch() WHERE user_id = ?'
        ).bind(JSON.stringify(content), theme, slug, user.id).run()
    } else {
        // Check slug uniqueness across all users
        const slugCheck = await c.env.DB.prepare(
            'SELECT id FROM resumes WHERE slug = ?'
        ).bind(slug).first()

        if (slugCheck) {
            return c.json({ error: 'Slug already taken' }, 409)
        }

        result = await c.env.DB.prepare(
            'INSERT INTO resumes (user_id, slug, content, theme) VALUES (?, ?, ?, ?)'
        ).bind(user.id, slug, JSON.stringify(content), theme || 'modern').run()
    }

    if (!result.success) {
        return c.json({ error: 'Failed to save resume' }, 500)
    }

    return c.json({ message: 'Resume saved successfully' })
})

export default resume
