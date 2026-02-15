<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const resume = ref(null)

onMounted(async () => {
  try {
    const slug = route.params.slug
    const data = await api.getPublicResume(slug)
    resume.value = data
  } catch (e) {
    error.value = 'Resume not found'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
    Loading...
  </div>
  
  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">
    {{ error }}
  </div>

  <div v-else class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
    <div class="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      
      <!-- Header -->
      <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <h1 class="text-4xl font-bold mb-2">{{ resume.content.personalInfo.name }}</h1>
        <p class="text-xl opacity-90 mb-4">{{ resume.content.personalInfo.title }}</p>
        <div class="flex flex-wrap gap-4 text-sm opacity-80">
          <span v-if="resume.content.personalInfo.email">📧 {{ resume.content.personalInfo.email }}</span>
          <span v-if="resume.content.personalInfo.phone">📱 {{ resume.content.personalInfo.phone }}</span>
          <span v-if="resume.content.personalInfo.location">📍 {{ resume.content.personalInfo.location }}</span>
        </div>
      </header>

      <div class="p-8 space-y-8">
        
        <!-- Bio -->
        <section v-if="resume.content.personalInfo.bio">
          <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b pb-2 border-gray-200">About Me</h2>
          <p class="text-gray-600 leading-relaxed">{{ resume.content.personalInfo.bio }}</p>
        </section>

        <!-- Experience -->
        <section v-if="resume.content.experience?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Experience</h2>
          <div class="space-y-6">
            <div v-for="(exp, index) in resume.content.experience" :key="index" class="relative pl-6 border-l-2 border-blue-200">
               <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
               <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                 <h3 class="text-lg font-bold text-gray-900">{{ exp.title }}</h3>
                 <span class="text-sm text-gray-500 font-medium">{{ exp.date }}</span>
               </div>
               <div class="text-blue-600 font-medium mb-2">{{ exp.company }}</div>
               <p class="text-gray-600 text-sm whitespace-pre-line">{{ exp.description }}</p>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section v-if="resume.content.education?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Education</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(edu, index) in resume.content.education" :key="index" class="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 class="font-bold text-gray-900">{{ edu.school }}</h3>
              <div class="text-gray-600 text-sm">{{ edu.degree }}</div>
              <div class="text-gray-400 text-xs mt-1">{{ edu.date }}</div>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section v-if="resume.content.skills?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Skills</h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="(skill, index) in resume.content.skills" :key="index" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
              {{ skill.name }}
            </span>
          </div>
        </section>

      </div>
    </div>
    <div class="text-center mt-8 text-gray-400 text-sm">
      Built with <a href="/" class="text-blue-500 hover:underline">Resumax</a>
    </div>
  </div>
</template>
