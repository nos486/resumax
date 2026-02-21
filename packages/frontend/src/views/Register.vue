<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

function handleGoogleLogin() {
  window.location.href = `${API_URL}/auth/google`
}

window.onCaptchaVerified = (token) => {
  captchaToken.value = token
}

const captchaToken = ref('')

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAA-placeholder'

onMounted(() => {
  // Wait for Turnstile script to load, then render the widget
  const renderTurnstile = () => {
    if (window.turnstile) {
      const container = document.querySelector('.cf-turnstile')
      if (container && !container.hasChildNodes()) {
        window.turnstile.render('.cf-turnstile', {
          sitekey: siteKey,
          callback: (token) => {
            captchaToken.value = token
          }
        })
      }
    } else {
      // Retry if script hasn't loaded yet
      setTimeout(renderTurnstile, 100)
    }
  }
  renderTurnstile()
})

async function handleRegister() {
  if (!captchaToken.value) {
    toast.error('Please complete the captcha')
    return
  }
  loading.value = true
  try {
    await api.register(email.value, password.value, captchaToken.value)
    toast.success('Account created! Please login.')
    router.push('/login')
  } catch (e) {
    toast.error(e.message)
    if (window.turnstile) window.turnstile.reset()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-gray-400 mb-2 font-medium">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
            placeholder="you@example.com"
          />
        </div>
        
        <div>
          <label class="block text-gray-400 mb-2 font-medium">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div class="space-y-2">
           <p class="text-[10px] text-gray-500 text-center uppercase tracking-widest">Please complete the captcha</p>
           <div class="flex justify-center">
              <div class="cf-turnstile" :data-sitekey="siteKey" data-callback="onCaptchaVerified"></div>
           </div>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <div class="relative my-4 flex items-center gap-3">
        <hr class="flex-1 border-gray-700" />
        <span class="text-xs text-gray-500 uppercase tracking-widest">or</span>
        <hr class="flex-1 border-gray-700" />
      </div>

      <button
        type="button"
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-3 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition border border-gray-600 hover:border-gray-400"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Continue with Google
      </button>

      <p class="mt-6 text-center text-gray-400">
        Already have an account?
        <router-link to="/login" class="text-purple-400 hover:text-purple-300 font-medium">Login</router-link>
      </p>
    </div>
  </div>
</template>
