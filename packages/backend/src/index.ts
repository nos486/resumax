import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Bindings, Variables } from './types'
import auth from './routes/auth'
import resume from './routes/resume'
import publicRoute from './routes/public'
import admin from './routes/admin'
import { openApiSpec } from './openapi'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS with credentials for httpOnly cookie sessions
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Set-Cookie', 'Retry-After'],
  })
  return corsMiddleware(c, next)
})

app.onError((err, c) => {
  console.error('Internal Server Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

app.route('/api/auth', auth)
app.route('/api/resume', resume)
app.route('/api/public', publicRoute)
app.route('/api/admin', admin)

app.get('/api/openapi.json', (c) => {
  return c.json(openApiSpec)
})

app.get('/', (c) => {
  return c.text('Resumax API')
})

export default app
