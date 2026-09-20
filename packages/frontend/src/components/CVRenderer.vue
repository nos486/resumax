<script setup lang="ts">
import { computed } from 'vue'
import { ResumeContent, sanitizeResumeContent } from '@resumax/shared'
import DynamicTheme from './themes/DynamicTheme.vue'
import ModernTheme from './themes/ModernTheme.vue'
import ProfessionalTheme from './themes/ProfessionalTheme.vue'

interface Props {
  content?: ResumeContent | null
  theme?: string
  slug?: string
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'modern',
  slug: '',
})

const normalizedResume = computed(() => ({
  content: sanitizeResumeContent(props.content || {}),
  theme: props.theme || 'modern',
  slug: props.slug || '',
}))
</script>

<template>
  <div class="cv-renderer w-full">
    <ModernTheme v-if="theme === 'modern'" :resume="normalizedResume" />
    <ProfessionalTheme v-else-if="theme === 'professional'" :resume="normalizedResume" />
    <DynamicTheme v-else :resume="normalizedResume" />
  </div>
</template>
