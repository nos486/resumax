import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Miniflare } from 'miniflare'
import app from '../src/index'
import {
  issueAccessToken,
  generateSecureToken,
  hashToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../src/auth-utils'

describe('Resumax Backend Route Suite', () => {
  let mf: Miniflare
  let db: any
  const JWT_SECRET = 'test-jwt-secret-key-32-characters-min'
  const FRONTEND_URL = 'http://localhost:5173'

  beforeAll(async () => {
    mf = new Miniflare({
      modules: true,
      script: 'export default { fetch() { return new Response("ok"); } }',
      d1Databases: ['DB'],
    })

    db = await mf.getD1Database('DB')

    // Apply schema statements
    const statements = [
      `CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          google_id TEXT UNIQUE,
          is_admin INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER DEFAULT (unixepoch())
      )`,
      `CREATE TABLE resumes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          content TEXT DEFAULT '{}',
          theme TEXT DEFAULT 'modern',
          updated_at INTEGER DEFAULT (unixepoch()),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at INTEGER NOT NULL,
          created_at INTEGER DEFAULT (unixepoch()),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX idx_users_email ON users(email)`,
      `CREATE INDEX idx_resumes_slug ON resumes(slug)`,
      `CREATE UNIQUE INDEX idx_resumes_user_id_unique ON resumes(user_id)`,
      `CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
    ]

    for (const stmt of statements) {
      await db.prepare(stmt).run()
    }
  })

  afterAll(async () => {
    if (mf) {
      await mf.dispose()
    }
  })

  const getEnv = () => ({
    DB: db,
    JWT_SECRET,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID: 'mock-client-id',
    GOOGLE_CLIENT_SECRET: 'mock-client-secret',
  })

  // ─── 1. Auth & Session Flow ───────────────────────────────────────────────
  describe('Authentication & Session Flow', () => {
    it('rejects /api/auth/me without an access token', async () => {
      const res = await app.request('/api/auth/me', { method: 'GET' }, getEnv())
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('authenticates /api/auth/me with a valid access cookie', async () => {
      // Seed user
      await db.prepare('INSERT INTO users (email, google_id) VALUES (?, ?)')
        .bind('john@example.com', 'google-123')
        .run()

      const user = await db.prepare('SELECT * FROM users WHERE email = ?')
        .bind('john@example.com')
        .first()

      const token = await issueAccessToken({ id: user.id, email: user.email, is_admin: false }, JWT_SECRET)

      const res = await app.request(
        '/api/auth/me',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${token}` },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.user.email).toBe('john@example.com')
      expect(body.user.id).toBe(user.id)
    })

    it('refreshes session and rotates refresh token on /api/auth/refresh', async () => {
      const user = await db.prepare('SELECT * FROM users WHERE email = ?')
        .bind('john@example.com')
        .first()

      const refreshToken = generateSecureToken()
      const hashedToken = await hashToken(refreshToken)
      const expiresAt = Math.floor(Date.now() / 1000) + 3600

      await db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
        .bind(user.id, hashedToken, expiresAt)
        .run()

      const res = await app.request(
        '/api/auth/refresh',
        {
          method: 'POST',
          headers: { Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.user.id).toBe(user.id)

      // Verify Set-Cookie headers contain new access and rotated refresh tokens
      const cookies = res.headers.get('set-cookie') || ''
      expect(cookies).toContain(ACCESS_COOKIE_NAME)
      expect(cookies).toContain(REFRESH_COOKIE_NAME)

      // Old refresh token must be rotated / replaced
      const oldTokenCheck = await db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?')
        .bind(hashedToken)
        .first()
      expect(oldTokenCheck).toBeNull()
    })

    it('logs out user and revokes refresh token on /api/auth/logout', async () => {
      const user = await db.prepare('SELECT * FROM users WHERE email = ?')
        .bind('john@example.com')
        .first()

      const refreshToken = generateSecureToken()
      const hashedToken = await hashToken(refreshToken)
      await db.prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
        .bind(user.id, hashedToken, Math.floor(Date.now() / 1000) + 3600)
        .run()

      const res = await app.request(
        '/api/auth/logout',
        {
          method: 'POST',
          headers: { Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)

      const tokenInDb = await db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?')
        .bind(hashedToken)
        .first()
      expect(tokenInDb).toBeNull()
    })
  })

  // ─── 2. Resume CRUD & Validation ──────────────────────────────────────────
  describe('Resume CRUD, Uniqueness, & Sanitization', () => {
    let authCookie: string
    let userId: number

    beforeAll(async () => {
      const user = await db.prepare('SELECT * FROM users WHERE email = ?')
        .bind('john@example.com')
        .first()
      userId = user.id
      const token = await issueAccessToken({ id: user.id, email: user.email, is_admin: false }, JWT_SECRET)
      authCookie = `${ACCESS_COOKIE_NAME}=${token}`
    })

    it('initializes default resume on first GET /api/resume', async () => {
      const res = await app.request(
        '/api/resume',
        {
          method: 'GET',
          headers: { Cookie: authCookie },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.user_id).toBe(userId)
      expect(body.slug).toBeDefined()
      expect(body.theme).toBe('modern')
      expect(body.content).toBeDefined()
    })

    it('rejects invalid slug with 400 Bad Request on PUT /api/resume', async () => {
      const res = await app.request(
        '/api/resume',
        {
          method: 'PUT',
          headers: {
            Cookie: authCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: 'bad slug with spaces!',
            theme: 'modern',
            content: { personalInfo: { name: 'John' } },
          }),
        },
        getEnv()
      )

      expect(res.status).toBe(400)
    })

    it('sanitizes dangerous URLs in resume content and saves successfully', async () => {
      const res = await app.request(
        '/api/resume',
        {
          method: 'PUT',
          headers: {
            Cookie: authCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: 'john-doe',
            theme: 'dynamic',
            content: {
              personalInfo: {
                name: 'John Doe',
                image: 'javascript:alert("xss")',
                links: [
                  { platform: 'Safe', url: 'https://example.com' },
                  { platform: 'XSS', url: 'javascript:window.location="http://evil.com"' },
                ],
              },
            },
          }),
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.slug).toBe('john-doe')

      // Verify in DB that XSS URLs were stripped
      const resume = await db.prepare('SELECT * FROM resumes WHERE slug = ?').bind('john-doe').first()
      const content = JSON.parse(resume.content)
      expect(content.personalInfo.image).toBe('')
      expect(content.personalInfo.links[0].url).toBe('https://example.com')
      expect(content.personalInfo.links[1].url).toBe('')
    })

    it('prevents slug collision across different users (409 Conflict)', async () => {
      // Create second user
      await db.prepare('INSERT INTO users (email, google_id) VALUES (?, ?)')
        .bind('alice@example.com', 'google-456')
        .run()
      const alice = await db.prepare('SELECT * FROM users WHERE email = ?').bind('alice@example.com').first()
      const aliceToken = await issueAccessToken({ id: alice.id, email: alice.email, is_admin: false }, JWT_SECRET)

      const res = await app.request(
        '/api/resume',
        {
          method: 'PUT',
          headers: {
            Cookie: `${ACCESS_COOKIE_NAME}=${aliceToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: 'john-doe', // Already taken by john
            theme: 'modern',
            content: { personalInfo: { name: 'Alice' } },
          }),
        },
        getEnv()
      )

      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.error).toContain('already taken')
    })
  })

  // ─── 3. Public Endpoint & Rate Limiting ───────────────────────────────────
  describe('Public Resume Endpoint & Rate Limiting', () => {
    it('serves sanitized public resume at /api/public/:slug', async () => {
      const res = await app.request('/api/public/john-doe', { method: 'GET' }, getEnv())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.slug).toBe('john-doe')
      expect(body.content.personalInfo.name).toBe('John Doe')
      expect(body.content.personalInfo.image).toBe('') // XSS was stripped
    })

    it('returns 404 for unknown slug', async () => {
      const res = await app.request('/api/public/non-existent-user-1234', { method: 'GET' }, getEnv())
      expect(res.status).toBe(404)
    })

    it('enforces rate limiting when threshold is exceeded', async () => {
      const testIp = '198.51.100.42'
      let lastStatus = 200

      // Send 62 rapid requests from test IP
      for (let i = 0; i < 62; i++) {
        const res = await app.request(
          '/api/public/john-doe',
          {
            method: 'GET',
            headers: { 'cf-connecting-ip': testIp },
          },
          getEnv()
        )
        lastStatus = res.status
      }

      expect(lastStatus).toBe(429)
    })
  })

  // ─── 4. Admin API Suite ───────────────────────────────────────────────────
  describe('Admin API Suite', () => {
    let adminToken: string
    let nonAdminToken: string

    beforeAll(async () => {
      // Seed admin user
      await db.prepare('INSERT INTO users (email, google_id, is_admin) VALUES (?, ?, ?)')
        .bind('admin@example.com', 'google-admin', 1)
        .run()
      const adminUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind('admin@example.com').first()
      adminToken = await issueAccessToken(
        { id: adminUser.id, email: adminUser.email, is_admin: true },
        JWT_SECRET
      )

      // Seed standard user
      const standardUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind('john@example.com').first()
      nonAdminToken = await issueAccessToken(
        { id: standardUser.id, email: standardUser.email, is_admin: false },
        JWT_SECRET
      )
    })

    it('denies access to non-admin users with 403 Forbidden', async () => {
      const res = await app.request(
        '/api/admin/users',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${nonAdminToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('allows admin user to list users with pagination and resume status', async () => {
      const res = await app.request(
        '/api/admin/users?page=1&limit=10',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.total).toBeGreaterThanOrEqual(2)
      expect(body.page).toBe(1)
      expect(body.limit).toBe(10)

      // Check row shape
      const userRow = body.data.find((u: any) => u.email === 'john@example.com')
      expect(userRow).toBeDefined()
      expect(userRow.resume_slug).toBe('john-doe')
      expect(userRow.is_admin).toBe(false)
      expect(userRow.resume_size).toBeGreaterThan(0)
    })

    it('sorts users by resume size (descending and ascending)', async () => {
      // Create a user with a much larger CV
      const largeContent = JSON.stringify({
        personalInfo: { name: 'Large CV User', bio: 'A'.repeat(5000) },
        experience: [],
        education: [],
        certifications: [],
        skills: [],
        customSections: [],
      })
      await db.prepare('INSERT INTO users (email, google_id) VALUES (?, ?)')
        .bind('large@example.com', 'google-large')
        .run()
      const largeUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind('large@example.com').first()
      await db.prepare('INSERT INTO resumes (user_id, slug, content, theme, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(largeUser.id, 'large-cv', largeContent, 'modern', 1700000000)
        .run()

      // Sort by size desc
      const resDesc = await app.request(
        '/api/admin/users?sortBy=resume_size&order=desc',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )
      expect(resDesc.status).toBe(200)
      const bodyDesc = await resDesc.json()
      expect(bodyDesc.data[0].email).toBe('large@example.com')
      expect(bodyDesc.data[0].resume_size).toBeGreaterThan(5000)

      // Sort by size asc
      const resAsc = await app.request(
        '/api/admin/users?sortBy=resume_size&order=asc',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )
      expect(resAsc.status).toBe(200)
      const bodyAsc = await resAsc.json()
      // Admin user has no resume, so resume_size should be 0
      expect(bodyAsc.data[0].resume_size).toBe(0)
    })

    it('sorts users by resume updated_at', async () => {
      const res = await app.request(
        '/api/admin/users?sortBy=resume_updated_at&order=desc',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data[0].resume_updated_at).toBeGreaterThanOrEqual(body.data[1]?.resume_updated_at || 0)
    })

    it('allows admin to fetch full user detail and CV content at /api/admin/users/:id', async () => {
      const john = await db.prepare('SELECT id FROM users WHERE email = ?').bind('john@example.com').first()

      const res = await app.request(
        `/api/admin/users/${john.id}`,
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe('john@example.com')
      expect(body.user.resume_slug).toBe('john-doe')
      expect(body.user.resume_size).toBeGreaterThan(0)
      expect(body.user.resume_content).toBeDefined()
      expect(body.user.resume_content.personalInfo.name).toBe('John Doe')
    })

    it('returns 404 when fetching a non-existent user ID', async () => {
      const res = await app.request(
        '/api/admin/users/99999',
        {
          method: 'GET',
          headers: { Cookie: `${ACCESS_COOKIE_NAME}=${adminToken}` },
        },
        getEnv()
      )

      expect(res.status).toBe(404)
    })
  })
})
