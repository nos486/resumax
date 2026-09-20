import { Hono } from 'hono'
import {
  AdminUserListItem,
  AdminUserDetail,
  PaginatedResponse,
  sanitizeResumeContent,
  ResumeContent,
} from '@resumax/shared'
import { Bindings, Variables } from '../types'
import { authMiddleware, adminOnly } from '../middleware'

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enforce both authentication and admin privileges on all /api/admin routes
admin.use('*', authMiddleware, adminOnly)

// ─── GET /api/admin/users ───────────────────────────────────────────────────
// ─── GET /api/admin/users ───────────────────────────────────────────────────
// Returns paginated list of all users with their resume status and size, sorted by updated_at, size, or created_at
admin.get('/users', async (c) => {
  const pageQuery = parseInt(c.req.query('page') || '1', 10)
  const limitQuery = parseInt(c.req.query('limit') || '25', 10)
  const sortByQuery = (c.req.query('sortBy') || c.req.query('sort') || 'resume_updated_at').toLowerCase()
  const orderQuery = (c.req.query('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  const page = isNaN(pageQuery) || pageQuery < 1 ? 1 : pageQuery
  const limit = isNaN(limitQuery) || limitQuery < 1 || limitQuery > 100 ? 25 : limitQuery
  const offset = (page - 1) * limit

  // Total count of registered users
  const totalResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
  const total = totalResult?.count || 0
  const totalPages = Math.ceil(total / limit)

  // Construct safe ORDER BY clause based on whitelist
  let orderByClause = 'ORDER BY (CASE WHEN r.updated_at IS NULL THEN 1 ELSE 0 END), r.updated_at DESC, u.created_at DESC'
  if (sortByQuery === 'resume_size' || sortByQuery === 'size') {
    orderByClause = `ORDER BY resume_size ${orderQuery}, u.id ${orderQuery}`
  } else if (sortByQuery === 'resume_updated_at' || sortByQuery === 'updated_at') {
    orderByClause = `ORDER BY (CASE WHEN r.updated_at IS NULL THEN 1 ELSE 0 END), r.updated_at ${orderQuery}, u.created_at ${orderQuery}`
  } else if (sortByQuery === 'created_at') {
    orderByClause = `ORDER BY u.created_at ${orderQuery}, u.id ${orderQuery}`
  }

  // Fetch users with resume summary info and CV size
  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.created_at, 
      u.is_admin,
      r.slug as resume_slug,
      r.theme as resume_theme,
      r.updated_at as resume_updated_at,
      COALESCE(LENGTH(r.content), 0) as resume_size
    FROM users u
    LEFT JOIN resumes r ON u.id = r.user_id
    ${orderByClause}
    LIMIT ? OFFSET ?
  `

  const records = await c.env.DB.prepare(query)
    .bind(limit, offset)
    .all<{
      id: number
      email: string
      created_at: number
      is_admin: number
      resume_slug: string | null
      resume_theme: string | null
      resume_updated_at: number | null
      resume_size: number
    }>()

  const data: AdminUserListItem[] = (records.results || []).map((row) => ({
    id: row.id,
    email: row.email,
    created_at: row.created_at,
    is_admin: Boolean(row.is_admin),
    resume_slug: row.resume_slug,
    resume_theme: row.resume_theme,
    resume_updated_at: row.resume_updated_at,
    resume_size: row.resume_size || 0,
  }))

  const response: PaginatedResponse<AdminUserListItem> = {
    data,
    page,
    limit,
    total,
    totalPages,
  }

  return c.json(response)
})

// ─── GET /api/admin/users/:id ───────────────────────────────────────────────
// Returns full user details + parsed resume content for admin CV inspection
admin.get('/users/:id', async (c) => {
  const userId = parseInt(c.req.param('id'), 10)

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user ID', code: 'INVALID_ID' }, 400)
  }

  const row = await c.env.DB.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.created_at, 
      u.is_admin,
      r.slug as resume_slug,
      r.theme as resume_theme,
      r.updated_at as resume_updated_at,
      COALESCE(LENGTH(r.content), 0) as resume_size,
      r.content as resume_content
    FROM users u
    LEFT JOIN resumes r ON u.id = r.user_id
    WHERE u.id = ?
  `)
    .bind(userId)
    .first<{
      id: number
      email: string
      created_at: number
      is_admin: number
      resume_slug: string | null
      resume_theme: string | null
      resume_updated_at: number | null
      resume_size: number
      resume_content: string | null
    }>()

  if (!row) {
    return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 404)
  }

  let resumeContent: ResumeContent | null = null
  if (row.resume_content) {
    try {
      const raw = typeof row.resume_content === 'string' ? JSON.parse(row.resume_content) : row.resume_content
      resumeContent = sanitizeResumeContent(raw)
    } catch {
      resumeContent = sanitizeResumeContent({})
    }
  }

  const userDetail: AdminUserDetail = {
    id: row.id,
    email: row.email,
    created_at: row.created_at,
    is_admin: Boolean(row.is_admin),
    resume_slug: row.resume_slug,
    resume_theme: row.resume_theme,
    resume_updated_at: row.resume_updated_at,
    resume_size: row.resume_size || 0,
    resume_content: resumeContent,
  }

  return c.json({ user: userDetail })
})

export default admin
