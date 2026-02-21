<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Register page is no longer needed — Google OAuth handles sign-up automatically.
// Redirect to login.
const router = useRouter()
onMounted(() => router.replace('/login'))
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <p class="text-gray-400">Redirecting...</p>
  </div>
</template>
