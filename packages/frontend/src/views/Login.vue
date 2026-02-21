<script setup>
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

function handleGoogleLogin() {
  window.location.href = `${API_URL}/auth/google`
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700 flex flex-col items-center gap-6">
      
      <div class="flex flex-col items-center gap-2">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg">R</div>
        <h1 class="text-2xl font-bold text-white">Resumax</h1>
        <p class="text-gray-400 text-sm text-center">Sign in to access your resume builder</p>
      </div>

      <button
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition shadow-lg"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Continue with Google
      </button>

      <p class="text-xs text-gray-600 text-center">
        No account? One will be created automatically on first sign-in.
      </p>
    </div>
  </div>
</template>
