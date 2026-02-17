<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
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
  Link as LinkIcon
} from 'lucide-vue-next'

const router = useRouter()
const loading = ref(true)
const activeTab = ref('editor') // 'editor' or 'preview'
const saving = ref(false)

const openSections = reactive({
  settings: false,
  theme: false,
  personal: true,
  experience: false,
  education: false,
  certifications: false,
  skills: false,
  custom: false
})

const toggleSection = (key) => {
  openSections[key] = !openSections[key]
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

async function saveResume() {
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
  resume.content.customSections.push({ id, title: 'New Section', content: '' })
  resume.content.themeConfig.sectionOrder.push(id)
}
function removeCustomSection(index) {
  const section = resume.content.customSections[index]
  resume.content.customSections.splice(index, 1)
  const orderIdx = resume.content.themeConfig.sectionOrder.indexOf(section.id)
  if (orderIdx > -1) resume.content.themeConfig.sectionOrder.splice(orderIdx, 1)
}
</script>

<template>
  <div class="h-screen bg-gray-950 text-gray-200 flex flex-col overflow-hidden">
    <!-- Top Navbar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-3 flex justify-between items-center z-30 shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">R</div>
        <h1 class="text-lg font-bold text-white hidden sm:block">Resumax Dashboard</h1>
      </div>

      <!-- Mobile Tab Switcher -->
      <div class="md:hidden flex bg-gray-800 rounded-lg p-1">
        <button 
          @click="activeTab = 'editor'"
          :class="activeTab === 'editor' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition duration-200"
        >
          Editor
        </button>
        <button 
          @click="activeTab = 'preview'"
          :class="activeTab === 'preview' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition duration-200"
        >
          Preview
        </button>
      </div>

      <div class="flex items-center gap-2 sm:gap-4">
        <a v-if="resume.slug" :href="`/v/${resume.slug}`" target="_blank" class="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800" title="View Public Page">
          <ExternalLink class="w-5 h-5" />
        </a>
        <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-400 transition rounded-full hover:bg-gray-800" title="Logout">
          <LogOut class="w-5 h-5" />
        </button>
        <button 
          @click="saveResume" 
          :disabled="saving" 
          class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span class="hidden sm:inline">{{ saving ? 'Saving...' : 'Save' }}</span>
        </button>
      </div>
    </nav>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-500 font-medium">
      <div class="animate-pulse flex flex-col items-center gap-4">
        <div class="w-12 h-12 bg-gray-800 rounded-full"></div>
        <span>Loading your workspace...</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <main v-else class="flex-1 flex overflow-hidden relative">
      
      <!-- Left Pane: Editor -->
      <div 
        :class="activeTab === 'editor' ? 'flex' : 'hidden'" 
        class="w-full md:w-1/2 lg:w-5/12 xl:w-[450px] md:flex flex-col border-r border-gray-800 bg-gray-900 relative z-20"
      >
        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          <!-- Accordion Sections -->
          
          <!-- 1. Settings -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('settings')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <Settings class="w-5 h-5 text-gray-400" />
                <span class="font-bold text-gray-200">Settings</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.settings }" />
            </button>
            <div v-if="openSections.settings" class="p-4 pt-0 border-t border-gray-800/50">
              <label class="block text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Public URL Slug</label>
              <div class="flex items-center bg-gray-950 rounded-lg border border-gray-800 focus-within:border-blue-500 transition px-3">
                <span class="text-gray-600 text-sm">resumax.me/v/</span>
                <input v-model="resume.slug" class="bg-transparent flex-1 py-2 px-1 text-white text-sm outline-none" />
              </div>
            </div>
          </div>

          <!-- 2. Appearance -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('theme')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition text-left">
              <div class="flex items-center gap-3">
                <Palette class="w-5 h-5 text-purple-400" />
                <span class="font-bold text-gray-200 text-left">Theme & Appearance</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.theme }" />
            </button>
            <div v-if="openSections.theme" class="p-4 pt-0 border-t border-gray-800/50">
              <ThemeCustomizer v-model="resume.content.themeConfig" :custom-sections="resume.content.customSections" />
            </div>
          </div>

          <!-- 3. Personal Info -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('personal')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <User class="w-5 h-5 text-blue-400" />
                <span class="font-bold text-gray-200">Personal Info</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.personal }" />
            </button>
            <div v-if="openSections.personal" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div class="pt-4 flex gap-4">
                <div class="relative group cursor-pointer" @click="$refs.fileInput.click()">
                  <div class="w-20 h-20 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden">
                    <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-full h-full object-cover" />
                    <ImageIcon v-else class="w-6 h-6 text-gray-700" />
                  </div>
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition">
                    <Plus class="w-6 h-6 text-white" />
                  </div>
                  <input ref="fileInput" type="file" @change="handleImageUpload" class="hidden" accept="image/*" />
                </div>
                <div class="flex-1 space-y-2">
                  <input v-model="resume.content.personalInfo.name" placeholder="Full Name" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm focus:border-blue-500 transition outline-none" />
                  <input v-model="resume.content.personalInfo.title" placeholder="Professional Title" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm focus:border-blue-500 transition outline-none" />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-2">
                <input v-model="resume.content.personalInfo.email" placeholder="Email Address" class="bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none" />
                <input v-model="resume.content.personalInfo.phone" placeholder="Phone Number" class="bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none" />
                <input v-model="resume.content.personalInfo.location" placeholder="Location" class="bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none" />
              </div>
              <textarea v-model="resume.content.personalInfo.bio" placeholder="Bio..." rows="3" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none resize-none"></textarea>
              
              <div class="space-y-2">
                <div class="flex justify-between items-center"><span class="text-xs font-bold text-gray-500 uppercase">Social Links</span><button @click="addLink" class="text-blue-500 hover:text-blue-400 text-xs">+ Add</button></div>
                <div v-for="(link, i) in resume.content.personalInfo.links" :key="i" class="flex gap-2 items-center bg-gray-950 p-2 rounded-lg border border-gray-800">
                  <IconPicker v-model="link.icon" />
                  <input v-model="link.platform" placeholder="Web" class="bg-transparent text-xs w-16 outline-none" />
                  <input v-model="link.url" placeholder="URL" class="bg-transparent flex-1 text-xs outline-none" />
                  <button @click="removeLink(i)" class="text-gray-600 hover:text-red-500"><Trash2 class="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Experience -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('experience')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <Briefcase class="w-5 h-5 text-orange-400" />
                <span class="font-bold text-gray-200">Experience</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.experience }" />
            </button>
            <div v-if="openSections.experience" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div v-for="(exp, i) in resume.content.experience" :key="i" class="pt-4 border-b border-gray-800/50 pb-4 last:border-0 relative group">
                <button @click="removeExperience(i)" class="absolute top-2 right-0 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
                <div class="flex gap-3 mb-2">
                  <IconPicker v-model="exp.icon" />
                  <div class="flex-1 space-y-2">
                    <input v-model="exp.title" placeholder="Role" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm outline-none" />
                    <input v-model="exp.company" placeholder="Company" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm outline-none" />
                  </div>
                </div>
                <input v-model="exp.date" placeholder="Duration (e.g. 2020 - 2024)" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs mb-2 outline-none" />
                <textarea v-model="exp.description" placeholder="Achievements..." rows="2" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs outline-none"></textarea>
              </div>
              <button @click="addExperience" class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition text-sm flex items-center justify-center gap-2">
                <PlusCircle class="w-4 h-4" /> Add Experience
              </button>
            </div>
          </div>

          <!-- 5. Education -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('education')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <GraduationCap class="w-5 h-5 text-teal-400" />
                <span class="font-bold text-gray-200">Education</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.education }" />
            </button>
            <div v-if="openSections.education" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div v-for="(edu, i) in resume.content.education" :key="i" class="pt-4 border-b border-gray-800/50 pb-4 last:border-0 relative group">
                <button @click="removeEducation(i)" class="absolute top-2 right-0 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
                <div class="flex gap-3 mb-2">
                  <IconPicker v-model="edu.icon" />
                  <div class="flex-1 space-y-2">
                    <input v-model="edu.school" placeholder="University" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm outline-none" />
                    <input v-model="edu.degree" placeholder="Major" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm outline-none" />
                  </div>
                </div>
                <input v-model="edu.date" placeholder="Year" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs outline-none" />
              </div>
              <button @click="addEducation" class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition text-sm flex items-center justify-center gap-2">
                <PlusCircle class="w-4 h-4" /> Add Education
              </button>
            </div>
          </div>

          <!-- 6. Certifications -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('certifications')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <Award class="w-5 h-5 text-yellow-400" />
                <span class="font-bold text-gray-200">Certifications</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.certifications }" />
            </button>
            <div v-if="openSections.certifications" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div v-for="(cert, i) in resume.content.certifications" :key="i" class="pt-4 border-b border-gray-800/50 pb-4 last:border-0 relative group">
                <button @click="removeCertification(i)" class="absolute top-2 right-0 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
                <div class="space-y-2">
                  <input v-model="cert.name" placeholder="Certification Name" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm outline-none" />
                  <div class="flex gap-2">
                    <input v-model="cert.issuer" placeholder="Issuer" class="flex-1 bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs outline-none" />
                    <input v-model="cert.date" placeholder="Year" class="w-20 bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs outline-none" />
                  </div>
                  <input v-model="cert.url" placeholder="Link" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-[10px] outline-none" />
                </div>
              </div>
              <button @click="addCertification" class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition text-sm flex items-center justify-center gap-2">
                <PlusCircle class="w-4 h-4" /> Add Certification
              </button>
            </div>
          </div>

          <!-- 7. Skills -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('skills')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <Wrench class="w-5 h-5 text-green-400" />
                <span class="font-bold text-gray-200">Skills</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.skills }" />
            </button>
            <div v-if="openSections.skills" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div v-for="(cat, catIdx) in resume.content.skills" :key="catIdx" class="pt-4 border-b border-gray-800/50 pb-4 last:border-0 relative group">
                <div class="flex justify-between mb-2">
                  <input v-model="cat.category" placeholder="Category" class="font-bold bg-transparent outline-none text-xs" />
                  <button @click="removeSkillCategory(catIdx)" class="text-gray-600 hover:text-red-500"><Trash2 class="w-3.5 h-3.5" /></button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(item, itemIdx) in cat.items" :key="itemIdx" class="flex items-center gap-1 bg-gray-950 border border-gray-800 px-2 py-1 rounded-md group/item transition hover:border-gray-600">
                    <input v-model="item.name" class="bg-transparent text-[10px] outline-none w-16" />
                    <button @click="removeSkillItem(catIdx, itemIdx)" class="text-gray-700 hover:text-red-400"><Trash2 class="w-2.5 h-2.5" /></button>
                  </div>
                  <button @click="addSkillItem(catIdx)" class="px-2 py-1 border border-dashed border-gray-800 rounded-md text-[10px] text-gray-600 hover:text-gray-400">+</button>
                </div>
              </div>
              <button @click="addSkillCategory" class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition text-sm flex items-center justify-center gap-2">
                <PlusCircle class="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          <!-- 8. Custom Sections -->
          <div class="rounded-xl border border-gray-800 bg-gray-800/20 overflow-hidden">
            <button @click="toggleSection('custom')" class="w-full p-4 flex justify-between items-center hover:bg-gray-800/40 transition">
              <div class="flex items-center gap-3">
                <PlusCircle class="w-5 h-5 text-pink-400" />
                <span class="font-bold text-gray-200">Custom Sections</span>
              </div>
              <ChevronDown class="w-4 h-4 transition-transform duration-300" :class="{ 'rotate-180': openSections.custom }" />
            </button>
            <div v-if="openSections.custom" class="p-4 pt-0 border-t border-gray-800/50 space-y-4">
              <div v-for="(section, i) in resume.content.customSections" :key="i" class="pt-4 border-b border-gray-800/50 pb-4 last:border-0 relative group">
                <button @click="removeCustomSection(i)" class="absolute top-2 right-0 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 class="w-4 h-4" /></button>
                <input v-model="section.title" placeholder="Title" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-sm font-bold mb-2 outline-none" />
                <textarea v-model="section.content" placeholder="Content... (Markdown supported)" rows="3" class="w-full bg-gray-950 border border-gray-800 rounded-lg py-1.5 px-3 text-xs outline-none resize-none"></textarea>
              </div>
              <button @click="addCustomSection" class="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-300 transition text-sm">
                + Add Custom Section
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Right Pane: Preview -->
      <div 
        :class="activeTab === 'preview' ? 'fixed inset-0 top-14 bg-gray-950' : 'hidden'" 
        class="flex-1 md:flex md:static flex-col bg-gray-200/5 overflow-hidden transition-all duration-300"
      >
        <div class="h-full w-full overflow-y-auto custom-scrollbar p-6 lg:p-12">
          <div class="max-w-[800px] mx-auto shadow-2xl origin-top scale-[0.85] lg:scale-100 transition-transform duration-500">
             <DynamicTheme :resume="resume" class="pointer-events-none" />
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
</style>
