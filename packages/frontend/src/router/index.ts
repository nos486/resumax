import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { api } from '../lib/api'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import PublicView from '../views/PublicView.vue'
import GoogleCallback from '../views/GoogleCallback.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/v/:slug', component: PublicView },
  { path: '/auth/callback', component: GoogleCallback },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let authCheckPromise: Promise<boolean> | null = null

async function checkAuth(): Promise<boolean> {
  if (localStorage.getItem('user')) {
    return true
  }

  if (authCheckPromise) return authCheckPromise

  authCheckPromise = api
    .getMe()
    .then(({ user }) => {
      localStorage.setItem('user', JSON.stringify(user))
      return true
    })
    .catch(() => {
      localStorage.removeItem('user')
      return false
    })
    .finally(() => {
      authCheckPromise = null
    })

  return authCheckPromise
}

router.beforeEach(async (to, _from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) {
      return next('/login')
    }
  } else if (to.meta.guestOnly) {
    const isAuthenticated = await checkAuth()
    if (isAuthenticated) {
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
