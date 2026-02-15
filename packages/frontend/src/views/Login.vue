import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin() {
  loading.value = true
  try {
    const data = await api.login(email.value, password.value)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    toast.success('Welcome back!')
    router.push('/dashboard')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-gray-400 mb-2 font-medium">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="you@example.com"
          />
        </div>
        
        <div>
          <label class="block text-gray-400 mb-2 font-medium">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="mt-6 text-center text-gray-400">
        Don't have an account? 
        <router-link to="/register" class="text-blue-400 hover:text-blue-300 font-medium">Register</router-link>
      </p>
    </div>
  </div>
</template>
