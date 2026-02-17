<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../lib/api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const resume = ref(null)

const themes = {
  modern: defineAsyncComponent(() => import('../components/themes/ModernTheme.vue')),
  professional: defineAsyncComponent(() => import('../components/themes/ProfessionalTheme.vue')),
  creative: defineAsyncComponent(() => import('../components/themes/CreativeTheme.vue')),
  // fallback
  minimal: defineAsyncComponent(() => import('../components/themes/ModernTheme.vue')), 
}

const CurrentTheme = computed(() => {
  if (!resume.value) return null
  const themeName = resume.value.theme || 'modern'
  return themes[themeName] || themes.modern
})

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

  <component :is="CurrentTheme" :resume="resume" v-else />
</template>

