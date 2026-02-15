<script setup>
import { ref, computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')

const iconList = Object.keys(icons).filter(key => key !== 'createLucideIcon' && key !== 'default')

const filteredIcons = computed(() => {
  if (!searchQuery.value) return iconList.slice(0, 50) // Limit initial render
  return iconList.filter(name => 
    name.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 50)
})

function selectIcon(name) {
  emit('update:modelValue', name)
  isOpen.value = false
}

// Dynamic icon component
const Icon = computed(() => {
  return props.modelValue && icons[props.modelValue] ? icons[props.modelValue] : null
})

const renderIcon = (name) => {
    return icons[name]
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center gap-2">
      <button 
        @click="isOpen = !isOpen"
        class="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition"
        type="button"
      >
        <component :is="Icon" v-if="Icon" class="w-4 h-4" />
        <span v-else class="text-gray-400 text-sm">Select Icon</span>
      </button>
      <button v-if="modelValue" @click="$emit('update:modelValue', '')" class="text-gray-500 hover:text-red-400" type="button">✕</button>
    </div>

    <div v-if="isOpen" class="absolute z-50 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
      <input 
        v-model="searchQuery" 
        placeholder="Search icons..." 
        class="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white mb-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
        autofocus
      />
      <div class="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
        <button 
          v-for="name in filteredIcons" 
          :key="name"
          @click="selectIcon(name)"
          class="p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white flex justify-center"
          :title="name"
        >
          <component :is="renderIcon(name)" class="w-5 h-5" />
        </button>
      </div>
    </div>
    
    <!-- Backdrop -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40" />
  </div>
</template>
