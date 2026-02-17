<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

window.onCaptchaVerified = (token) => {
  captchaToken.value = token
}

const captchaToken = ref('')

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAA-placeholder'

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

        <div class="flex justify-center py-2">
           <div class="cf-turnstile" :data-sitekey="siteKey" data-callback="onCaptchaVerified"></div>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <p class="mt-6 text-center text-gray-400">
        Already have an account? 
        <router-link to="/login" class="text-purple-400 hover:text-purple-300 font-medium">Login</router-link>
      </p>
    </div>
  </div>
</template>
