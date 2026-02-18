<script setup>
import { ref, onMounted, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import IconPicker from '../components/IconPicker.vue'
import ThemeCustomizer from '../components/ThemeCustomizer.vue'
import DynamicTheme from '../components/themes/DynamicTheme.vue'
import { 
  Settings, 
  Palette, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Wrench, 
  PlusCircle, 
  LogOut, 
  Save, 
  Eye, 
  ChevronDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  GripVertical
} from 'lucide-vue-next'

const router = useRouter()
const loading = ref(true)
const activeTab = ref('editor') // 'editor' or 'preview'
const activeSection = ref('personal')
const saving = ref(false)
const isFullPreview = ref(false)


// Resizable Panel Logic
const editorWidth = ref(450) // Default width in pixels
const isResizing = ref(false)

const startResizing = () => {
  isResizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResizing)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (e) => {
  if (!isResizing.value) return
  // Sidebar is 64px, so we subtract that
  const newWidth = e.clientX - 64
  if (newWidth > 320 && newWidth < 800) {
    editorWidth.value = newWidth
  }
}

const stopResizing = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResizing)
  document.body.style.cursor = 'default'
  document.body.style.userSelect = 'auto'
}

const toggleFullPreview = () => {
  isFullPreview.value = !isFullPreview.value
  if (isFullPreview.value) {
    // Hidden via v-show, but we can set 0 for logic consistency
  }
}

const resume = reactive({
  slug: '',
  theme: 'modern',
  content: {
    personalInfo: { 
      name: '', title: '', bio: '', email: '', phone: '', location: '',
      image: '', 
      links: [] 
    },
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    customSections: [],
    themeConfig: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#f3f4f6',
        surface: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        accent: '#3b82f6',
        sectionTitle: '#3b82f6'
      },
      font: 'Inter',
      layout: '1-column',
      sectionOrder: ['bio', 'experience', 'education', 'certifications', 'skills'],
      borderRadius: 'rounded',
      showIcons: true
    }
  }
})

onMounted(async () => {
  try {
    const data = await api.getResume()
    if (data) {
      resume.slug = data.slug || ''
      resume.theme = data.theme || 'modern'
      if (data.content) {
        resume.content = { ...resume.content, ...data.content }
      }
      
      // Migration: ensure certifications is in sectionOrder
      if (resume.content.themeConfig?.sectionOrder && !resume.content.themeConfig.sectionOrder.includes('certifications')) {
        const eduIdx = resume.content.themeConfig.sectionOrder.indexOf('education')
        if (eduIdx > -1) {
          resume.content.themeConfig.sectionOrder.splice(eduIdx + 1, 0, 'certifications')
        } else {
          resume.content.themeConfig.sectionOrder.push('certifications')
        }
      }
      
      // Ensure arrays exist
      if (!resume.content.certifications) resume.content.certifications = []
      if (!resume.content.skills) resume.content.skills = []
      if (!resume.content.customSections) resume.content.customSections = []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const isSlugValid = computed(() => !resume.slug || resume.slug.length >= 4)

async function saveResume() {
  if (!isSlugValid.value) {
    toast.error('Slug must be at least 4 characters long.')
    return
  }
  saving.value = true
  try {
    await api.updateResume({
      slug: resume.slug,
      theme: resume.theme,
      content: resume.content
    })
    toast.success('Resume saved successfully!')
  } catch (e) {
    toast.error('Error saving: ' + e.message)
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
  toast.info('Logged out')
}

// Handlers
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file || file.size > 2 * 1024 * 1024) {
    toast.error('Image must be under 2MB.')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    resume.content.personalInfo.image = e.target.result
    toast.success('Image uploaded!')
  }
  reader.readAsDataURL(file)
}

function addLink() { resume.content.personalInfo.links.push({ platform: '', url: '', icon: 'Link' }) }
function removeLink(index) { resume.content.personalInfo.links.splice(index, 1) }

function addExperience() { resume.content.experience.push({ title: '', company: '', date: '', description: '', icon: 'Briefcase' }) }
function removeExperience(index) { resume.content.experience.splice(index, 1) }

function addEducation() { resume.content.education.push({ degree: '', school: '', date: '', icon: 'GraduationCap' }) }
function removeEducation(index) { resume.content.education.splice(index, 1) }

function addCertification() { resume.content.certifications.push({ name: '', issuer: '', date: '', url: '' }) }
function removeCertification(index) { resume.content.certifications.splice(index, 1) }

function addSkillCategory() { resume.content.skills.push({ category: 'New Category', items: [] }) }
function removeSkillCategory(index) { resume.content.skills.splice(index, 1) }
function addSkillItem(catIdx) { resume.content.skills[catIdx].items.push({ name: '', icon: '' }) }
function removeSkillItem(catIdx, itemIdx) { resume.content.skills[catIdx].items.splice(itemIdx, 1) }

function addCustomSection() {
  const id = `custom-${Date.now()}`
  if (!resume.content.customSections) resume.content.customSections = []
  resume.content.customSections.push({ id, title: 'New Section', content: '' })
  
  // Add to order lists
  resume.content.themeConfig.sectionOrder.push(id)
  if (resume.content.themeConfig.columnAssignment) {
    resume.content.themeConfig.columnAssignment.leftColumn.push(id)
  }
}
function removeCustomSection(index) {
  const section = resume.content.customSections[index]
  if (!section) return
  resume.content.customSections.splice(index, 1)
  const orderIdx = resume.content.themeConfig.sectionOrder.indexOf(section.id)
  if (orderIdx > -1) resume.content.themeConfig.sectionOrder.splice(orderIdx, 1)
  if (resume.content.themeConfig.columnAssignment) {
    const leftIdx = resume.content.themeConfig.columnAssignment.leftColumn.indexOf(section.id)
    if (leftIdx > -1) resume.content.themeConfig.columnAssignment.leftColumn.splice(leftIdx, 1)
    const rightIdx = resume.content.themeConfig.columnAssignment.rightColumn.indexOf(section.id)
    if (rightIdx > -1) resume.content.themeConfig.columnAssignment.rightColumn.splice(rightIdx, 1)
  }
}
</script>

<template>
  <div class="h-screen bg-gray-950 text-gray-200 flex flex-col overflow-hidden">
    <!-- Top Navbar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-3 flex justify-between items-center z-50 shadow-2xl relative">
      <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">R</div>
        <h1 class="text-lg font-bold text-white hidden sm:block">Resumax</h1>
      </router-link>

      <!-- Mobile Tab Switcher -->
      <div class="md:hidden flex bg-gray-800 rounded-lg p-1">
        <button @click="activeTab = 'editor'" :class="activeTab === 'editor' ? 'bg-gray-700 text-white' : 'text-gray-400'" class="px-4 py-1.5 rounded-md text-sm font-medium transition">Editor</button>
        <button @click="activeTab = 'preview'" :class="activeTab === 'preview' ? 'bg-gray-700 text-white' : 'text-gray-400'" class="px-4 py-1.5 rounded-md text-sm font-medium transition">Preview</button>
      </div>

      <div class="flex items-center gap-4">
        <a v-if="resume.slug" :href="`/v/${resume.slug}`" target="_blank" class="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800" title="View Public Page">
          <ExternalLink class="w-5 h-5" />
        </a>
        <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-400 transition rounded-full hover:bg-gray-800" title="Logout">
          <LogOut class="w-5 h-5" />
        </button>
        <button @click="saveResume" :disabled="saving" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50">
          <Save class="w-4 h-4" />
          <span class="hidden sm:inline">{{ saving ? 'Saving...' : 'Save' }}</span>
        </button>
      </div>
    </nav>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-500">
      <div class="animate-pulse flex flex-col items-center gap-4">
        <div class="w-12 h-12 bg-gray-800 rounded-full"></div>
        <span>Initializing Workspace...</span>
      </div>
    </div>

    <!-- Main Content Area: 3-Column Layout -->
    <main v-else class="flex-1 flex overflow-hidden relative">
      
      <!-- 1. Left Navigation Sidebar (Desktop Only) -->
      <aside :class="isFullPreview ? 'hidden' : 'hidden md:flex'" class="w-16 flex-col items-center py-6 bg-gray-900 border-r border-gray-800 z-30 space-y-6">
        <button @click="activeSection = 'personal'" :class="activeSection === 'personal' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Personal Info">
          <User class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'experience'" :class="activeSection === 'experience' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Experience">
          <Briefcase class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'education'" :class="activeSection === 'education' ? 'text-teal-500 bg-teal-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Education">
          <GraduationCap class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'certifications'" :class="activeSection === 'certifications' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Certifications">
          <Award class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'skills'" :class="activeSection === 'skills' ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Skills">
          <Wrench class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'custom'" :class="activeSection === 'custom' ? 'text-pink-500 bg-pink-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Custom Sections">
          <PlusCircle class="w-6 h-6" />
        </button>
        <div class="flex-1"></div>
        <button @click="activeSection = 'theme'" :class="activeSection === 'theme' ? 'text-purple-500 bg-purple-500/10' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Appearance">
          <Palette class="w-6 h-6" />
        </button>
        <button @click="activeSection = 'settings'" :class="activeSection === 'settings' ? 'text-gray-300 bg-gray-800' : 'text-gray-500 hover:text-gray-300'" class="p-3 rounded-xl transition" title="Settings">
          <Settings class="w-6 h-6" />
        </button>
      </aside>

      <!-- 2. Middle Editor Panel -->
      <div 
        v-show="!isFullPreview"
        :class="activeTab === 'editor' ? 'flex' : 'hidden md:flex'"
        :style="{ width: editorWidth + 'px' }"
        class="flex-col h-full bg-gray-900 border-r border-gray-800 z-20 overflow-hidden transition-all duration-75 relative"
      >
        <!-- Editor Header -->
        <header class="px-6 py-4 flex items-center justify-between border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 class="font-bold text-white capitalize text-lg flex items-center gap-2">
            <User v-if="activeSection === 'personal'" class="w-5 h-5 text-blue-400" />
            <Briefcase v-if="activeSection === 'experience'" class="w-5 h-5 text-orange-400" />
            <GraduationCap v-if="activeSection === 'education'" class="w-5 h-5 text-teal-400" />
            <Award v-if="activeSection === 'certifications'" class="w-5 h-5 text-yellow-400" />
            <Wrench v-if="activeSection === 'skills'" class="w-5 h-5 text-green-400" />
            <PlusCircle v-if="activeSection === 'custom'" class="w-5 h-5 text-pink-400" />
            <Palette v-if="activeSection === 'theme'" class="w-5 h-5 text-purple-400" />
            <Settings v-if="activeSection === 'settings'" class="w-5 h-5 text-gray-400" />
            {{ activeSection }}
          </h2>
          <div class="md:hidden">
            <button @click="activeTab = 'preview'" class="text-xs text-blue-500 font-bold border border-blue-500 px-3 py-1 rounded-full">Preview</button>
          </div>
        </header>

        <!-- Editor Content -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar pb-20">
          
          <div v-if="activeSection === 'personal'" class="space-y-6">
            <div class="flex gap-6 items-start">
               <div class="relative group cursor-pointer" @click="$refs.fileInput.click()">
                <div class="w-24 h-24 rounded-2xl bg-gray-950 border-2 border-dashed border-gray-800 flex items-center justify-center overflow-hidden transition group-hover:border-blue-500/50">
                  <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-full h-full object-cover" />
                  <ImageIcon v-else class="w-8 h-8 text-gray-700" />
                </div>
                <div class="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition shadow-lg">
                  <Plus class="w-6 h-6 text-white" />
                </div>
                <input ref="fileInput" type="file" @change="handleImageUpload" class="hidden" accept="image/*" />
              </div>
              <div class="flex-1 space-y-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input v-model="resume.content.personalInfo.name" placeholder="John Doe" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Title</label>
                  <input v-model="resume.content.personalInfo.title" placeholder="Senior Product Designer" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm focus:border-blue-500 outline-none transition" />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4">
              <input v-model="resume.content.personalInfo.email" placeholder="Email" class="bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm outline-none" />
              <input v-model="resume.content.personalInfo.phone" placeholder="Phone" class="bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm outline-none" />
              <input v-model="resume.content.personalInfo.location" placeholder="Location" class="bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm outline-none" />
            </div>
            <textarea v-model="resume.content.personalInfo.bio" placeholder="Write a brief professional summary..." rows="4" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-sm outline-none resize-none focus:border-blue-500 transition"></textarea>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center"><span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Social Links</span><button @click="addLink" class="text-blue-500 text-xs font-bold">+ Add</button></div>
              <div v-for="(link, i) in resume.content.personalInfo.links" :key="i" class="flex gap-2 items-center bg-gray-950 p-2 rounded-xl border border-gray-800 group">
                <IconPicker v-model="link.icon" />
                <input v-model="link.platform" placeholder="Web" class="bg-transparent text-xs w-16 outline-none" />
                <input v-model="link.url" placeholder="URL" class="bg-transparent flex-1 text-xs outline-none" />
                <button @click="removeLink(i)" class="p-1 text-gray-700 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div v-if="activeSection === 'experience'" class="space-y-6">
            <div v-for="(exp, i) in resume.content.experience" :key="i" class="relative bg-gray-950/50 p-6 rounded-2xl border border-gray-800 group shadow-lg transition-all hover:bg-gray-900/50">
              <button @click="removeExperience(i)" class="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
              <div class="flex gap-4 mb-4">
                <IconPicker v-model="exp.icon" />
                <div class="flex-1 space-y-3">
                  <input v-model="exp.title" placeholder="Job Title" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm font-bold outline-none focus:border-blue-500" />
                  <input v-model="exp.company" placeholder="Company Name" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm outline-none" />
                </div>
              </div>
              <input v-model="exp.date" placeholder="Date Range" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs mb-3 outline-none" />
              <textarea v-model="exp.description" placeholder="Description of your role and achievements..." rows="4" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs outline-none focus:border-blue-500"></textarea>
            </div>
            <button @click="addExperience" class="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-blue-500 hover:border-blue-500/50 transition font-bold text-sm">
              + Add Experience
            </button>
          </div>

          <div v-if="activeSection === 'education'" class="space-y-6">
            <div v-for="(edu, i) in resume.content.education" :key="i" class="relative bg-gray-950/50 p-6 rounded-2xl border border-gray-800 group">
              <button @click="removeEducation(i)" class="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
              <div class="flex gap-4 mb-4">
                <IconPicker v-model="edu.icon" />
                <div class="flex-1 space-y-3">
                  <input v-model="edu.school" placeholder="School / University" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm font-bold outline-none" />
                  <input v-model="edu.degree" placeholder="Degree / Certification" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm outline-none" />
                </div>
              </div>
              <input v-model="edu.date" placeholder="Year" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs outline-none" />
            </div>
            <button @click="addEducation" class="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-teal-500 hover:border-teal-500/50 transition font-bold text-sm">
              + Add Education
            </button>
          </div>

          <div v-if="activeSection === 'certifications'" class="space-y-6">
            <div v-for="(cert, i) in resume.content.certifications" :key="i" class="relative bg-gray-950/50 p-6 rounded-2xl border border-gray-800 group">
              <button @click="removeCertification(i)" class="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
              <div class="space-y-4">
                <input v-model="cert.name" placeholder="Certificate Name" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm font-bold outline-none" />
                <div class="flex gap-3">
                  <input v-model="cert.issuer" placeholder="Issuer" class="flex-1 bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs outline-none" />
                  <input v-model="cert.date" placeholder="Year" class="w-24 bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs outline-none shadow-inner" />
                </div>
                <input v-model="cert.url" placeholder="Verify Link (URL)" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-[10px] outline-none font-mono" />
              </div>
            </div>
            <button @click="addCertification" class="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-yellow-500 hover:border-yellow-500/50 transition font-bold text-sm">
              + Add Certification
            </button>
          </div>

          <div v-if="activeSection === 'skills'" class="space-y-6">
            <div v-for="(cat, catIdx) in resume.content.skills" :key="catIdx" class="bg-gray-950/50 p-6 rounded-2xl border border-gray-800 relative group">
              <button @click="removeSkillCategory(catIdx)" class="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
              <input v-model="cat.category" placeholder="Skill Group Name (e.g. Design)" class="font-bold bg-transparent outline-none mb-4 text-white text-base focus:text-blue-400 transition" />
              <div class="flex flex-wrap gap-2">
                <div v-for="(item, itemIdx) in cat.items" :key="itemIdx" class="flex items-center gap-1 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg group/item hover:border-gray-600 transition">
                  <input v-model="item.name" class="bg-transparent text-xs outline-none w-20" />
                  <button @click="removeSkillItem(catIdx, itemIdx)" class="text-gray-700 hover:text-red-400 transition"><Trash2 class="w-3 h-3" /></button>
                </div>
                <button @click="addSkillItem(catIdx)" class="px-3 py-1.5 border border-dashed border-gray-800 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all hover:border-gray-600">+</button>
              </div>
            </div>
            <button @click="addSkillCategory" class="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-green-500 hover:border-green-500/50 transition font-bold text-sm">
              + Add Skill Category
            </button>
          </div>

          <div v-if="activeSection === 'custom'" class="space-y-6">
            <div v-for="(section, i) in resume.content.customSections" :key="i" class="relative bg-gray-950/50 p-6 rounded-2xl border border-gray-800 group shadow-lg">
              <button @click="removeCustomSection(i)" class="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
              <input v-model="section.title" placeholder="Section Title" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-sm font-bold mb-4 outline-none" />
              <textarea v-model="section.content" placeholder="Content... Supports basic text and returns." rows="8" class="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-3 text-xs outline-none resize-none"></textarea>
            </div>
            <button @click="addCustomSection" class="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-pink-500 hover:border-pink-500/50 transition font-bold text-sm">
              + Add Custom Section
            </button>
          </div>

          <div v-if="activeSection === 'theme'">
             <ThemeCustomizer v-model="resume.content.themeConfig" :custom-sections="resume.content.customSections" />
          </div>

          <div v-if="activeSection === 'settings'" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Public URL Slug</label>
              <div class="flex items-center bg-gray-950 rounded-xl border border-gray-800 focus-within:border-blue-500 transition px-4 py-1 shadow-inner">
                <span class="text-gray-600 text-sm font-mono">resumax.me/v/</span>
                <input v-model="resume.slug" class="bg-transparent flex-1 py-2 px-1 text-white text-sm outline-none font-bold" />
              </div>
              <p v-if="resume.slug && resume.slug.length < 4" class="text-[10px] text-red-500 mt-1 font-bold animate-pulse">Slug must be at least 4 characters.</p>
              <p class="text-[10px] text-gray-600 italic">This is the unique address where your resume will be live.</p>
            </div>
          </div>

        </div>
      </div>

      <!-- 3. Draggable Divider (Desktop Only) -->
      <div 
        v-if="!isFullPreview"
        @mousedown="startResizing"
        class="hidden md:flex w-1.5 h-full bg-gray-800/20 hover:bg-blue-600/50 cursor-col-resize z-30 transition-colors group relative shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
      >
        <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 h-12 bg-gray-800 rounded-full my-auto opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-gray-700 pointer-events-none">
          <GripVertical class="w-3 h-3 text-gray-400" />
        </div>
      </div>

      <!-- 4. Flex Preview Panel -->
      <div 
        :class="activeTab === 'preview' ? 'fixed inset-0 top-14 bg-gray-950' : 'hidden md:flex'" 
        class="flex-1 flex flex-col bg-gray-950 relative overflow-hidden transition-all duration-300"
      >
        <!-- Preview Tools -->
        <div class="h-14 border-b border-gray-800 bg-gray-900/50 px-6 flex items-center justify-between z-10">
          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            Live Preview
          </span>
          <div class="flex items-center gap-3">
             <button @click="toggleFullPreview" class="text-[10px] font-bold border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-1.5 rounded-full transition-all flex items-center gap-2 shadow-lg">
               <component :is="isFullPreview ? ChevronRight : ChevronLeft" class="w-3.5 h-3.5" />
               {{ isFullPreview ? 'Exit Full View' : 'Full Page View' }}
             </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 flex justify-center items-start p-8 pb-32" :style="{ backgroundColor: resume.content?.themeConfig?.colors?.background || '#f3f4f6' }">
          <div class="w-full max-w-5xl transition-all">
             <div class="custom-scrollbar bg-white">
                <DynamicTheme :resume="resume" class="pointer-events-none" />
             </div>
          </div>
        </div>
      </div>

    </main>

    <div v-if="isResizing" class="fixed inset-0 z-50 cursor-col-resize"></div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }

.flex-1 {
  scrollbar-gutter: stable;
}
</style>
