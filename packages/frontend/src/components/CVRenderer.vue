<script setup lang="ts">
import { computed } from 'vue'
import { ResumeContent, sanitizeResumeContent } from '@resumax/shared'
import DynamicTheme from './themes/DynamicTheme.vue'

interface Props {
  content?: ResumeContent | null
  theme?: string
  slug?: string
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'dynamic',
  slug: '',
})

const normalizedResume = computed(() => ({
  content: sanitizeResumeContent(props.content || {}),
  theme: props.theme || 'dynamic',
  slug: props.slug || '',
}))
</script>

<template>
  <div class="cv-renderer w-full">
    <!-- DynamicTheme is the platform's multi-layout, multi-column, and preset engine -->
    <DynamicTheme :resume="normalizedResume" />
  </div>
</template>
