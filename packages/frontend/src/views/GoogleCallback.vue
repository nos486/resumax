<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../lib/toast'

const router = useRouter()
const error = ref('')

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const userParam = params.get('user')
  const err = params.get('error')

  if (err) {
    error.value = err
    toast.error('Google login failed: ' + err)
    setTimeout(() => router.push('/login'), 3000)
    return
  }

  if (!token) {
    error.value = 'No token received.'
    toast.error('Login failed. No token received.')
    setTimeout(() => router.push('/login'), 3000)
    return
  }

  try {
    const user = JSON.parse(decodeURIComponent(userParam || '{}'))
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    toast.success('Signed in with Google!')
    router.replace('/dashboard')
  } catch (e) {
    error.value = 'Failed to parse session.'
    toast.error('Login error. Please try again.')
    setTimeout(() => router.push('/login'), 3000)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <div class="text-center space-y-4">
      <div v-if="!error" class="flex flex-col items-center gap-4">
        <div class="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-400 text-sm font-medium">Signing you in...</p>
      </div>
      <div v-else class="text-red-400 space-y-2">
        <p class="text-lg font-bold">Login Failed</p>
        <p class="text-sm text-gray-400">{{ error }}</p>
        <p class="text-xs text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  </div>
</template>
