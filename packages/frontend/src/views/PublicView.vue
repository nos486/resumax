<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'
import DynamicTheme from '../components/themes/DynamicTheme.vue'

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

  <div v-else class="min-h-screen py-12 px-4 shadow-sm" :style="{ backgroundColor: resume.content?.themeConfig?.colors?.background || '#f3f4f6' }">
    <div class="max-w-5xl mx-auto shadow-2xl overflow-hidden ring-1 ring-black/5">
      <DynamicTheme :resume="resume" />
    </div>
  </div>
</template>
