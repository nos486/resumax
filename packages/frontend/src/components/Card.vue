<script setup lang="ts">
interface Props {
  title?: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="bg-gray-800 border border-gray-700/80 rounded-2xl shadow-xl overflow-hidden transition">
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-gray-700/60 flex items-center justify-between">
      <div>
        <h3 v-if="title" class="text-base font-semibold text-white">{{ title }}</h3>
        <p v-if="description" class="text-xs text-gray-400 mt-0.5">{{ description }}</p>
      </div>
      <slot name="header-action" />
    </div>

    <div class="p-6">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-3 border-t border-gray-700/60 bg-gray-900/40">
      <slot name="footer" />
    </div>
  </div>
</template>
