import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { api } from '../lib/api'
import { AuthUser } from '@resumax/shared'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import PublicView from '../views/PublicView.vue'
import GoogleCallback from '../views/GoogleCallback.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/v/:slug', component: PublicView },
  { path: '/auth/callback', component: GoogleCallback },
  { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, adminOnly: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let authCheckPromise: Promise<AuthUser | null> | null = null

async function checkAuth(): Promise<AuthUser | null> {
  const cached = localStorage.getItem('user')
  if (cached) {
    try {
      return JSON.parse(cached) as AuthUser
    } catch {
      localStorage.removeItem('user')
    }
  }

  if (authCheckPromise) return authCheckPromise

  authCheckPromise = api
    .getMe()
    .then(({ user }) => {
      localStorage.setItem('user', JSON.stringify(user))
      return user
    })
    .catch(() => {
      localStorage.removeItem('user')
      return null
    })
    .finally(() => {
      authCheckPromise = null
    })

  return authCheckPromise
}

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const user = await checkAuth()
    if (!user) {
      return next('/login')
    }

    // Protect /admin routes against non-admin users
    if (to.meta.adminOnly && !user.is_admin) {
      return next('/dashboard')
    }
  } else if (to.meta.guestOnly) {
    const user = await checkAuth()
    if (user) {
      return next('/dashboard')
    }
  }
  next()
})

// Listen for session expiry event to redirect user to login
if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    router.push('/login')
  })
}

export default router
