<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
    <h1 class="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
      Resumax
    </h1>
    <p class="text-xl text-gray-400 mb-8">Create your premium resume in minutes.</p>
    <div class="flex gap-4">
      <router-link to="/login" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">
        Login
      </router-link>
      <router-link to="/register" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition">
        Register
      </router-link>
    </div>
  </div>
</template>
