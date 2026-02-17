<script setup>
import { reactive, watch } from 'vue'
import { GripVertical } from 'lucide-vue-next'

const props = defineProps({
  modelValue: Object,
  customSections: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

// ... presets ... (unchanged)
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

watch(config, (newVal) => { emit('update:modelValue', { ...newVal }) }, { deep: true })

function saveCustomPreset() {
  const name = prompt('Enter a name for your custom preset:', 'My Custom Theme')
  if (!name) return
  const newPreset = { name, ...JSON.parse(JSON.stringify(config)) }
  customPresets.push(newPreset)
  localStorage.setItem('resumax_custom_presets', JSON.stringify(customPresets))
}

function removeCustomPreset(index) {
  if (!confirm('Delete this preset?')) return
  customPresets.splice(index, 1)
  localStorage.setItem('resumax_custom_presets', JSON.stringify(customPresets))
}

function applyCustomPreset(preset) {
  const { name, ...settings } = preset
  Object.assign(config, JSON.parse(JSON.stringify(settings)))
}

function applyPreset(presetName) {
  const preset = presets[presetName]
  Object.assign(config, JSON.parse(JSON.stringify(preset)))
  if (!config.colors.sectionTitle) config.colors.sectionTitle = config.colors.accent
  config.layout = preset.layout || '1-column'
  config.sectionOrder = ['bio', 'experience', 'education', 'certifications', 'skills']
  config.columnAssignment = {
    leftColumn: ['bio', 'skills', 'certifications'],
    rightColumn: ['experience', 'education']
  }
}

const availableSections = [
  { id: 'bio', label: 'About / Bio' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Licenses & Certifications' },
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

function onDragStart(index, listType) {
  draggedFromList = listType
  if (listType === 'main') {
    draggedItem = config.sectionOrder[index]
  } else {
    draggedItem = config.columnAssignment[listType][index]
  }
}

function onDragOver(event, index, listType) {
  event.preventDefault()
  if (draggedFromList !== listType) return
  
  const list = listType === 'main' ? config.sectionOrder : config.columnAssignment[listType]
  const currentIndex = list.indexOf(draggedItem)
  if (currentIndex === index) return

  list.splice(currentIndex, 1)
  list.splice(index, 0, draggedItem)
}

function onDrop(event, index, listType) {
  event.preventDefault()
  if (!draggedItem || draggedFromList === listType) return

  // Remove from source
  const sourceList = draggedFromList === 'main' ? config.sectionOrder : config.columnAssignment[draggedFromList]
  const sourceIdx = sourceList.indexOf(draggedItem)
  if (sourceIdx > -1) sourceList.splice(sourceIdx, 1)

  // Add to target at index
  const targetList = listType === 'main' ? config.sectionOrder : config.columnAssignment[listType]
  if (index === -1) {
    targetList.push(draggedItem)
  } else {
    targetList.splice(index, 0, draggedItem)
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
    <!-- Section Order / Column Assignment -->
    <div>
      <h3 class="text-sm font-bold text-gray-300 mb-2">Section Layout</h3>
      
      <!-- Desktop Column Assignment (Only for 2-column) -->
      <div v-if="config.layout === '2-column'" class="mb-6">
        <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">Desktop Layout (2 Columns)</h4>
        <div class="grid grid-cols-2 gap-4">
          <!-- Left Column -->
          <div class="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <h5 class="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Left Column</h5>
            <div class="space-y-2 min-h-[120px] pb-8" @dragover.prevent @drop="onDrop($event, -1, 'leftColumn')">
              <div 
                v-for="(sectionId, index) in config.columnAssignment.leftColumn" 
                :key="sectionId"
                draggable="true"
                @dragstart="onDragStart(index, 'leftColumn')"
                @dragover="onDragOver($event, index, 'leftColumn')"
                @drop.stop="onDrop($event, index, 'leftColumn')"
                @dragend="onDragEnd"
                class="bg-gray-700 p-2.5 rounded-lg cursor-move hover:bg-gray-600 transition flex items-center justify-between gap-2 border border-gray-600 group active:scale-95 active:rotate-1"
              >
                <div class="flex items-center gap-2 overflow-hidden">
                  <GripVertical class="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                  <span class="text-white text-xs truncate font-medium">{{ getSectionLabel(sectionId) }}</span>
                </div>
                <button @click.stop="moveSection(sectionId, 'leftColumn', 'rightColumn')" class="text-gray-500 hover:text-blue-400 p-1 rounded hover:bg-gray-800 transition" title="Move to Right Column">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <h5 class="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Right Column</h5>
            <div class="space-y-2 min-h-[120px] pb-8" @dragover.prevent @drop="onDrop($event, -1, 'rightColumn')">
              <div 
                v-for="(sectionId, index) in config.columnAssignment.rightColumn" 
                :key="sectionId"
                draggable="true"
                @dragstart="onDragStart(index, 'rightColumn')"
                @dragover="onDragOver($event, index, 'rightColumn')"
                @drop.stop="onDrop($event, index, 'rightColumn')"
                @dragend="onDragEnd"
                class="bg-gray-700 p-2.5 rounded-lg cursor-move hover:bg-gray-600 transition flex items-center justify-between gap-2 border border-gray-600 group active:scale-95 active:rotate-1"
              >
                <button @click.stop="moveSection(sectionId, 'rightColumn', 'leftColumn')" class="text-gray-500 hover:text-blue-400 p-1 rounded hover:bg-gray-800 transition" title="Move to Left Column">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div class="flex items-center gap-2 overflow-hidden flex-1 justify-end">
                  <span class="text-white text-xs truncate font-medium">{{ getSectionLabel(sectionId) }}</span>
                  <GripVertical class="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile / Linear Order -->
      <div class="mt-8">
        <h4 class="text-xs font-bold text-gray-400 uppercase mb-2">
          {{ config.layout === '2-column' ? 'Mobile Order (Stacked)' : 'Section Order' }}
        </h4>
        <p v-if="config.layout === '2-column'" class="text-[10px] text-gray-500 mb-3 italic">
          Defines the sequence for mobile devices and single-column views.
        </p>
        <div class="space-y-2 min-h-[50px]" @dragover.prevent @drop="onDrop($event, -1, 'main')">
          <div 
            v-for="(sectionId, index) in config.sectionOrder" 
            :key="sectionId"
            draggable="true"
            @dragstart="onDragStart(index, 'main')"
            @dragover="onDragOver($event, index, 'main')"
            @drop.stop="onDrop($event, index, 'main')"
            @dragend="onDragEnd"
            class="bg-gray-800/50 p-3 rounded-xl border border-gray-700 cursor-move hover:bg-gray-800 hover:border-blue-500/50 transition flex items-center gap-3 active:scale-95"
          >
            <GripVertical class="w-4 h-4 text-gray-600" />
            <span class="text-white text-sm font-medium">{{ getSectionLabel(sectionId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Show Icons Toggle -->
    <div class="pt-4 border-t border-gray-800">
      <label class="flex items-center gap-3 cursor-pointer group">
        <div class="relative">
          <input type="checkbox" v-model="config.showIcons" class="sr-only peer" />
          <div class="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
          <div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </div>
        <span class="text-sm text-gray-300 group-hover:text-white transition">Show Icons in Resume</span>
      </label>
    </div>
  </div>
</template>
