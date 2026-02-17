<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Object,
  customSections: { type: Array, default: () => [] }
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
    layout: '1-column',
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
    layout: '2-column',
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
    layout: '1-column',
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
    layout: '1-column',
    borderRadius: 'none'
  },
  classic: {
    colors: {
      primary: '#1a365d',
      secondary: '#2c5282',
      background: '#fffaf0',
      surface: '#ffffff',
      text: '#2d3748',
      textSecondary: '#4a5568',
      accent: '#c53030'
    },
    font: 'Playfair Display',
    layout: '1-column',
    borderRadius: 'none'
  },
  swiss: {
    colors: {
      primary: '#d90429',
      secondary: '#ef233c',
      background: '#edf2f4',
      surface: '#ffffff',
      text: '#2b2d42',
      textSecondary: '#8d99ae',
      accent: '#d90429'
    },
    font: 'Inter',
    layout: '2-column',
    borderRadius: 'none'
  },
  terminal: {
    colors: {
      primary: '#00ff41',
      secondary: '#008f11',
      background: '#0d0208',
      surface: '#0d0208',
      text: '#00ff41',
      textSecondary: '#008f11',
      accent: '#003b00'
    },
    font: 'JetBrains Mono',
    layout: '1-column',
    borderRadius: 'none'
  }
}

const config = reactive({ ...props.modelValue })
const customPresets = reactive(JSON.parse(localStorage.getItem('resumax_custom_presets') || '[]'))

// Ensure config has columnAssignment & sectionTitle color
if (!config.columnAssignment) {
  config.columnAssignment = {
    leftColumn: ['bio', 'skills'],
    rightColumn: ['experience', 'education']
  }
}
if (!config.colors.sectionTitle) {
  config.colors.sectionTitle = config.colors.accent
}

watch(config, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

function saveCustomPreset() {
  const name = prompt('Enter a name for your custom preset:', 'My Custom Theme')
  if (!name) return
  
  const newPreset = {
    name,
    ...JSON.parse(JSON.stringify(config))
  }
  
  customPresets.push(newPreset)
  localStorage.setItem('resumax_custom_presets', JSON.stringify(customPresets))
}

function removeCustomPreset(index) {
  if (!confirm('Delete this preset?')) return
  customPresets.splice(index, 1)
  localStorage.setItem('resumax_custom_presets', JSON.stringify(customPresets))
}

function applyCustomPreset(preset) {
  // Exclude name from properties to copy
  const { name, ...settings } = preset
  Object.assign(config, JSON.parse(JSON.stringify(settings)))
}

function applyPreset(presetName) {
  const preset = presets[presetName]
  Object.assign(config, JSON.parse(JSON.stringify(preset)))
  
  // Set default sectionTitle if missing in preset
  if (!config.colors.sectionTitle) {
    config.colors.sectionTitle = config.colors.accent
  }
  
  // Reset layouts defaults
  config.layout = preset.layout || '1-column'
  
  config.sectionOrder = ['bio', 'experience', 'education', 'skills']
  config.columnAssignment = {
    leftColumn: ['bio', 'skills'],
    rightColumn: ['experience', 'education']
  }
}

const availableSections = [
  { id: 'bio', label: 'About / Bio' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' }
]

function getSectionLabel(id) {
  const builtin = availableSections.find(s => s.id === id)
  if (builtin) return builtin.label
  if (id.startsWith('custom-') && props.customSections) {
    const custom = props.customSections.find(s => s.id === id)
    if (custom) return custom.title || 'Untitled Section'
  }
  return id
}

let draggedItem = null
let draggedFromList = null

function onDragStart(index, listName) {
  if (listName === 'main') {
    draggedItem = config.sectionOrder[index]
    draggedFromList = 'main'
  } else if (listName === 'leftColumn') {
    draggedItem = config.columnAssignment.leftColumn[index]
    draggedFromList = 'leftColumn'
  } else if (listName === 'rightColumn') {
    draggedItem = config.columnAssignment.rightColumn[index]
    draggedFromList = 'rightColumn'
  }
}

// Reordering within same list (for 1-column)
function onDragOver(event, index, listName) {
  event.preventDefault()
  if (listName !== 'main' || draggedFromList !== 'main') return
  
  const currentIndex = config.sectionOrder.indexOf(draggedItem)
  if (currentIndex === index) return

  const items = [...config.sectionOrder]
  items.splice(currentIndex, 1)
  items.splice(index, 0, draggedItem)
  config.sectionOrder = items
}

// Dropping between columns
function onDrop(targetList) {
  if (!draggedItem || !draggedFromList) return
  if (draggedFromList === targetList) return

  // Remove from source
  if (draggedFromList === 'leftColumn') {
    const idx = config.columnAssignment.leftColumn.indexOf(draggedItem)
    config.columnAssignment.leftColumn.splice(idx, 1)
  } else if (draggedFromList === 'rightColumn') {
    const idx = config.columnAssignment.rightColumn.indexOf(draggedItem)
    config.columnAssignment.rightColumn.splice(idx, 1)
  }

  // Add to target
  if (targetList === 'leftColumn') {
    config.columnAssignment.leftColumn.push(draggedItem)
  } else {
    config.columnAssignment.rightColumn.push(draggedItem)
  }
  
  draggedItem = null
  draggedFromList = null
}

function onDragEnd() {
  draggedItem = null
  draggedFromList = null
}

function moveSection(sectionId, from, to) {
  const fromList = config.columnAssignment[from]
  const toList = config.columnAssignment[to]
  
  const idx = fromList.indexOf(sectionId)
  if (idx > -1) {
    fromList.splice(idx, 1)
    toList.push(sectionId)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Presets -->
    <div>
      <div class="flex justify-between items-center mb-2">
         <h3 class="text-sm font-bold text-gray-300">Quick Presets</h3>
         <div class="flex gap-2">
           <button @click="saveCustomPreset" class="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition">Save Current</button>
         </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- Render default presets -->
        <button v-for="(preset, name) in presets" :key="name" @click="applyPreset(name)" class="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-750 hover:border-blue-500 transition group relative">
           <div class="flex gap-1">
             <div class="w-4 h-4 rounded-full" :style="{ background: preset.colors.primary }"></div>
             <div class="w-4 h-4 rounded-full" :style="{ background: preset.colors.secondary }"></div>
             <div class="w-4 h-4 rounded-full border border-gray-600" :style="{ background: preset.colors.background }"></div>
           </div>
           <span class="text-xs font-medium text-gray-300 capitalize group-hover:text-white">{{ name }}</span>
        </button>

        <!-- Render user custom presets -->
        <button v-for="(preset, index) in customPresets" :key="'custom-'+index" @click="applyCustomPreset(preset)" class="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 hover:border-green-500 transition group relative">
           <button @click.stop="removeCustomPreset(index)" class="absolute top-1 right-1 text-gray-600 hover:text-red-400 text-xs">✕</button>
           <div class="flex gap-1">
             <div class="w-4 h-4 rounded-full" :style="{ background: preset.colors.primary }"></div>
             <div class="w-4 h-4 rounded-full" :style="{ background: preset.colors.secondary }"></div>
             <div class="w-4 h-4 rounded-full border border-gray-600" :style="{ background: preset.colors.background }"></div>
           </div>
           <span class="text-xs font-medium text-gray-300 truncate w-full text-center group-hover:text-white">{{ preset.name }}</span>
        </button>
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
          <label class="text-xs text-gray-400 block mb-1">Accent (Details)</label>
          <input type="color" v-model="config.colors.accent" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Section Titles</label>
          <input type="color" v-model="config.colors.sectionTitle" class="w-full h-10 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
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
        <button @click="config.layout = '1-column'" :class="config.layout === '1-column' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">1 Column</button>
        <button @click="config.layout = '2-column'" :class="config.layout === '2-column' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'" class="px-3 py-2 rounded text-sm font-medium transition">2 Columns</button>
      </div>
    </div>

    <!-- Section Order / Column Assignment -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">
        {{ config.layout === '2-column' ? 'Column Assignment' : 'Section Order (Drag to Reorder)' }}
      </h3>
      
      <!-- 1 Column Mode -->
      <div v-if="config.layout === '1-column'" class="space-y-2">
        <div 
          v-for="(sectionId, index) in config.sectionOrder" 
          :key="sectionId"
          draggable="true"
          @dragstart="onDragStart(index, 'main')"
          @dragover="(e) => onDragOver(e, index, 'main')"
          @dragend="onDragEnd"
          class="bg-gray-700 p-3 rounded cursor-move hover:bg-gray-600 transition flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span class="text-white text-sm">{{ getSectionLabel(sectionId) }}</span>
        </div>
      </div>

      <!-- 2 Column Mode -->
      <div v-else class="grid grid-cols-2 gap-4">
        <!-- Left Column -->
        <div class="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 class="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Left Column</h4>
          <div class="space-y-2 min-h-[100px]" @dragover.prevent @drop="onDrop('leftColumn')">
            <div 
              v-for="(sectionId, index) in config.columnAssignment.leftColumn" 
              :key="sectionId"
              draggable="true"
              @dragstart="onDragStart(index, 'leftColumn')"
              class="bg-gray-700 p-2 rounded cursor-move hover:bg-gray-600 transition flex items-center justify-between gap-1"
            >
              <span class="text-white text-xs truncate">{{ getSectionLabel(sectionId) }}</span>
              <button @click="moveSection(sectionId, 'leftColumn', 'rightColumn')" class="text-gray-400 hover:text-white text-xs">→</button>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 class="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Right Column</h4>
          <div class="space-y-2 min-h-[100px]" @dragover.prevent @drop="onDrop('rightColumn')">
            <div 
              v-for="(sectionId, index) in config.columnAssignment.rightColumn" 
              :key="sectionId"
              draggable="true"
              @dragstart="onDragStart(index, 'rightColumn')"
              class="bg-gray-700 p-2 rounded cursor-move hover:bg-gray-600 transition flex items-center justify-between gap-1"
            >
              <button @click="moveSection(sectionId, 'rightColumn', 'leftColumn')" class="text-gray-400 hover:text-white text-xs">←</button>
              <span class="text-white text-xs truncate">{{ getSectionLabel(sectionId) }}</span>
            </div>
          </div>
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
