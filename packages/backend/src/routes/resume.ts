import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  UpdateResumeInputSchema,
  sanitizeResumeContent,
  ResumeContent,
  ResumeRecord,
} from '@resumax/shared'
import { Bindings, Variables } from '../types'
import { authMiddleware } from '../middleware'

const resume = new Hono<{ Bindings: Bindings; Variables: Variables }>()

resume.use('*', authMiddleware)

/**
 * Generate a random unique slug of 6 alphanumeric characters.
 */
async function generateUniqueSlug(db: Bindings['DB']): Promise<string> {
  let isUnique = false
  let slug = ''
  while (!isUnique) {
    slug = Math.random().toString(36).substring(2, 8)
    const check = await db.prepare('SELECT id FROM resumes WHERE slug = ?').bind(slug).first()
    if (!check) {
      isUnique = true
    }
  }
  return slug
}

// ─── GET /api/resume ────────────────────────────────────────────────────────
// Retrieve the authenticated user's resume, initializing a default if none exists.
resume.get('/', async (c) => {
  const user = c.get('user')
  const record = await c.env.DB.prepare('SELECT * FROM resumes WHERE user_id = ?')
    .bind(user.id)
    .first<{ id: number; user_id: number; slug: string; content: string | ResumeContent; theme: string; updated_at: number }>()

  if (!record) {
    const slug = await generateUniqueSlug(c.env.DB)
    const initialContent = sanitizeResumeContent({})

    const insertResult = await c.env.DB.prepare(
      'INSERT INTO resumes (user_id, slug, content, theme) VALUES (?, ?, ?, ?) RETURNING *'
    )
      .bind(user.id, slug, JSON.stringify(initialContent), 'modern')
      .first<{ id: number; user_id: number; slug: string; content: string; theme: string; updated_at: number }>()

    if (!insertResult) {
      return c.json({ error: 'Failed to initialize resume' }, 500)
    }

    return c.json({
      ...insertResult,
      content: initialContent,
    })
  }

  // Parse and sanitize stored content
  let parsedContent: ResumeContent
  try {
    const raw = typeof record.content === 'string' ? JSON.parse(record.content) : record.content
    parsedContent = sanitizeResumeContent(raw)
  } catch {
    parsedContent = sanitizeResumeContent({})
  }

  return c.json({
    ...record,
    content: parsedContent,
  })
})

// ─── PUT /api/resume ────────────────────────────────────────────────────────
// Save resume content, theme, and custom slug with strict Zod validation.
resume.put('/', zValidator('json', UpdateResumeInputSchema), async (c) => {
  const user = c.get('user')
  let { content, theme, slug } = c.req.valid('json')

  // Auto-generate slug if not provided or empty
  if (!slug || slug.trim() === '') {
    slug = await generateUniqueSlug(c.env.DB)
  }

  // Check if slug is already taken by a different user
  const slugConflict = await c.env.DB.prepare(
    'SELECT id FROM resumes WHERE slug = ? AND user_id != ?'
  )
    .bind(slug, user.id)
    .first()

  if (slugConflict) {
    return c.json({ error: 'This vanity URL slug is already taken by another user' }, 409)
  }

  // Deep sanitize all URLs and fields in content
  const sanitizedContent = sanitizeResumeContent(content)
  const contentString = JSON.stringify(sanitizedContent)

  // Upsert resume for this user (enforces 1 resume per user)
  const existing = await c.env.DB.prepare('SELECT id FROM resumes WHERE user_id = ?')
    .bind(user.id)
    .first()

  let result
  if (existing) {
    result = await c.env.DB.prepare(
      'UPDATE resumes SET content = ?, theme = ?, slug = ?, updated_at = unixepoch() WHERE user_id = ?'
    )
      .bind(contentString, theme, slug, user.id)
      .run()
  } else {
    result = await c.env.DB.prepare(
      'INSERT INTO resumes (user_id, slug, content, theme) VALUES (?, ?, ?, ?)'
    )
      .bind(user.id, slug, contentString, theme)
      .run()
  }

  if (!result.success) {
    return c.json({ error: 'Failed to save resume' }, 500)
  }

  return c.json({
    message: 'Resume saved successfully',
    slug,
  })
})

export default resume
