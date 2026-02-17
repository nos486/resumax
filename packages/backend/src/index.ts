import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Bindings, Variables } from './types'
import auth from './routes/auth'
import resume from './routes/resume'
import publicRoute from './routes/public'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', cors())

app.onError((err, c) => {
  console.error('Internal Server Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})


app.route('/api/auth', auth)
app.route('/api/resume', resume)
app.route('/api/public', publicRoute)

app.get('/', (c) => {
  return c.text('Resumax API')
})


export default app
