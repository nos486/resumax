<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])

const presets = {
  modern: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#f3f4f6',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#3b82f6'
    },
    font: 'Inter',
    layout: 'full-width',
    borderRadius: 'rounded'
  },
  professional: {
    colors: {
      primary: '#1f2937',
      secondary: '#4b5563',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      accent: '#1f2937'
    },
    font: 'Merriweather',
    layout: 'sidebar',
    borderRadius: 'none'
  },
  creative: {
    colors: {
      primary: '#ec4899',
      secondary: '#f59e0b',
      background: '#fef3c7',
      surface: '#ffffff',
      text: '#78350f',
      textSecondary: '#92400e',
      accent: '#ec4899'
    },
    font: 'Playfair Display',
    layout: 'full-width',
    borderRadius: 'rounded'
  },
  minimal: {
    colors: {
      primary: '#000000',
      secondary: '#404040',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#000000',
      textSecondary: '#737373',
      accent: '#000000'
    },
    font: 'Roboto',
    layout: 'full-width',
    borderRadius: 'none'
  }
}

const config = reactive({ ...props.modelValue })

watch(config, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

function applyPreset(presetName) {
  Object.assign(config, presets[presetName])
  config.sectionOrder = ['bio', 'experience', 'education', 'skills']
  config.showIcons = true
}

// Section ordering
const availableSections = [
  { id: 'bio', label: 'About / Bio' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' }
]

let draggedIndex = null

function onDragStart(index) {
  draggedIndex = index
}

function onDragOver(event, index) {
  event.preventDefault()
  if (draggedIndex === null || draggedIndex === index) return
  
  const items = [...config.sectionOrder]
  const draggedItem = items[draggedIndex]
  items.splice(draggedIndex, 1)
  items.splice(index, 0, draggedItem)
  
  config.sectionOrder = items
  draggedIndex = index
}

function onDragEnd() {
  draggedIndex = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Presets -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Quick Presets</h3>
      <div class="grid grid-cols-2 gap-2">
        <button @click="applyPreset('modern')" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition">Modern</button>
        <button @click="applyPreset('professional')" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition">Professional</button>
        <button @click="applyPreset('creative')" class="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded text-sm font-medium transition">Creative</button>
        <button @click="applyPreset('minimal')" class="px-3 py-2 bg-black hover:bg-gray-900 text-white rounded text-sm font-medium transition">Minimal</button>
      </div>
    </div>

    <!-- Colors -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Colors</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-400 block mb-1">Primary</label>
          <input type="color" v-model="config.colors.primary" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Secondary</label>
          <input type="color" v-model="config.colors.secondary" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Background</label>
          <input type="color" v-model="config.colors.background" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Surface</label>
          <input type="color" v-model="config.colors.surface" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Text</label>
          <input type="color" v-model="config.colors.text" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Accent</label>
          <input type="color" v-model="config.colors.accent" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
      </div>
    </div>

    <!-- Font -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Font Family</h3>
      <select v-model="config.font" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white outline-none text-sm">
        <option value="Inter">Inter (Sans-serif)</option>
        <option value="Roboto">Roboto (Sans-serif)</option>
        <option value="Merriweather">Merriweather (Serif)</option>
        <option value="Playfair Display">Playfair Display (Serif)</option>
        <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
      </select>
    </div>

    <!-- Layout -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Layout</h3>
      <div class="grid grid-cols-2 gap-2">
        <button @click="config.layout = 'full-width'" :class="config.layout === 'full-width' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">Full Width</button>
        <button @click="config.layout = 'sidebar'" :class="config.layout === 'sidebar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">Sidebar</button>
      </div>
    </div>

    <!-- Border Radius -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Border Style</h3>
      <div class="grid grid-cols-2 gap-2">
        <button @click="config.borderRadius = 'rounded'" :class="config.borderRadius === 'rounded' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">Rounded</button>
        <button @click="config.borderRadius = 'none'" :class="config.borderRadius === 'none' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">Sharp</button>
      </div>
    </div>

    <!-- Section Order -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Section Order (Drag to Reorder)</h3>
      <div class="space-y-2">
        <div 
          v-for="(sectionId, index) in config.sectionOrder" 
          :key="sectionId"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover="(e) => onDragOver(e, index)"
          @dragend="onDragEnd"
          class="bg-gray-700 p-3 rounded cursor-move hover:bg-gray-600 transition flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span class="text-white text-sm">{{ availableSections.find(s => s.id === sectionId)?.label }}</span>
        </div>
      </div>
    </div>

    <!-- Show Icons Toggle -->
    <div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="config.showIcons" class="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
        <span class="text-sm text-gray-300">Show Icons in Resume</span>
      </label>
    </div>
  </div>
</template>
