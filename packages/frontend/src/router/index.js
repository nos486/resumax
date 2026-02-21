import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import PublicView from '../views/PublicView.vue'
import GoogleCallback from '../views/GoogleCallback.vue'

const routes = [
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

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else if (to.meta.guestOnly && token) {
        next('/dashboard')
    } else {
        next()
    }
})


export default router
