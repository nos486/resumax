import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  SlugParamSchema,
  sanitizeResumeContent,
  PublicResumeResponse,
} from '@resumax/shared'
import { Bindings } from '../types'

const publicRoute = new Hono<{ Bindings: Bindings }>()

// ─── In-Memory Rate Limiting ────────────────────────────────────────────────
// Protect public endpoints from scraping and DoS (60 requests / minute / IP)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60

function rateLimiter() {
  return async (c: any, next: any) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1'

    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS,
      })
    } else {
      entry.count++
      if (entry.count > MAX_REQUESTS_PER_WINDOW) {
        const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000)
        c.header('Retry-After', String(retryAfterSeconds))
        return c.json(
          {
            error: 'Too many requests. Please slow down and try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          429
        )
      }
    }

    // Garbage collect old rate limit entries periodically (every 1000 entries)
    if (rateLimitMap.size > 1000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key)
        }
      }
    }

    await next()
  }
}

publicRoute.use('*', rateLimiter())

// ─── GET /api/public/:slug ──────────────────────────────────────────────────
publicRoute.get('/:slug', zValidator('param', SlugParamSchema), async (c) => {
  const { slug } = c.req.valid('param')

  const resume = await c.env.DB.prepare(
    'SELECT slug, content, theme, updated_at FROM resumes WHERE slug = ?'
  )
    .bind(slug)
    .first<{ slug: string; content: string; theme: string; updated_at: number }>()

  if (!resume) {
    return c.json({ error: 'Resume not found', code: 'NOT_FOUND' }, 404)
  }

  let parsedContent
  try {
    const raw = typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content
    parsedContent = sanitizeResumeContent(raw)
  } catch {
    parsedContent = sanitizeResumeContent({})
  }

  const response: PublicResumeResponse = {
    slug: resume.slug,
    content: parsedContent,
    theme: resume.theme,
    updated_at: resume.updated_at,
  }

  return c.json(response)
})

export default publicRoute
