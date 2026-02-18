<script setup>
import { Layout, Palette, FileDown, Github } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
    
    <!-- Navbar -->
    <nav class="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">R</div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Resumax</span>
      </div>
      <div class="flex gap-4">
        <router-link to="/login" class="text-gray-300 hover:text-white transition font-medium py-2">Login</router-link>
        <router-link to="/register" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-medium transition shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40">Get Started</router-link>
      </div>
    </nav>

    <!-- Hero Section -->
    <header class="container mx-auto px-6 py-20 md:py-32 text-center relative overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div class="max-w-4xl mx-auto relative z-10">
        <div class="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-sm">
          🚀 The Ultimate Open Source Resume Builder
        </div>
        <h1 class="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
          Craft Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Perfect Resume</span> in Minutes.
        </h1>
        <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stand out from the crowd with professional, customizable themes. Real-time preview, privacy-first, and completely free.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <router-link to="/register" class="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:scale-105 active:scale-100 duration-200">
            Build My Resume
          </router-link>
          <a href="https://github.com/nos486/resumax" target="_blank" class="px-8 py-4 bg-gray-800 text-white rounded-full font-bold text-lg hover:bg-gray-700 transition border border-gray-700 flex items-center justify-center gap-2 hover:border-gray-600">
            <Github class="w-5 h-5" />
            Star on GitHub
          </a>
        </div>
      </div>
    </header>

    <!-- Features Section -->
    <section class="container mx-auto px-6 py-10 pb-32">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/60 transition group backdrop-blur-sm">
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition duration-300">
            <Palette class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-gray-100">Customizable Themes</h3>
          <p class="text-gray-400 leading-relaxed">Choose from tailored presets or customize every color, font, and layout to match your personal brand perfectly.</p>
        </div>

        <!-- Feature 2 -->
        <div class="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/60 transition group backdrop-blur-sm">
          <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition duration-300">
            <Layout class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-gray-100">Real-time Preview</h3>
          <p class="text-gray-400 leading-relaxed">See your changes instantly as you type. Adjust mobile and desktop layouts independently for perfect presentation.</p>
        </div>

        <!-- Feature 3 -->
        <div class="p-8 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/60 transition group backdrop-blur-sm">
          <div class="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition duration-300">
            <FileDown class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold mb-3 text-gray-100">Privacy First</h3>
          <p class="text-gray-400 leading-relaxed">Your data is yours. Export freely to PDF or JSON. No paywalls, no tracking, just a great resume builder.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-800 bg-gray-950/50 backdrop-blur">
      <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="text-gray-500 text-sm">
          &copy; {{ new Date().getFullYear() }} Resumax. All rights reserved.
        </div>
        
        <div class="flex items-center gap-4">
          <a href="/v/sina" target="_blank" class="text-blue-400 hover:text-blue-300 transition text-sm font-medium hover:underline">
            View Sample Resume
          </a>
          <span class="text-gray-700 hidden sm:inline">|</span>
          <a href="https://github.com/nos486/resumax" target="_blank" class="text-gray-400 hover:text-white transition flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-700">
            <Github class="w-4 h-4" />
            nos486/resumax
          </a>
        </div>
      </div>
    </footer>

  </div>
</template>
