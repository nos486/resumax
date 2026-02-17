<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import IconPicker from '../components/IconPicker.vue'
import ThemeCustomizer from '../components/ThemeCustomizer.vue'

const router = useRouter()
const loading = ref(true)

const saving = ref(false)
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
    experience: [],
    education: [],
    skills: [], // Now array of categories: { category: 'Frontend', items: [{ name: 'Vue', icon: 'Smile' }] }
    customSections: [], // { id: 'custom-1', title: 'Projects', content: '...' }
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
      sectionOrder: ['bio', 'experience', 'education', 'skills'],
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
      // Merge content to ensure structure exists
      if (data.content) {
        resume.content = { ...resume.content, ...data.content }
      }
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

// Image Upload
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Image too large. Please choose a file under 2MB.')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 400
      const MAX_HEIGHT = 400
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      // Compress to JPEG at 80% quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resume.content.personalInfo.image = dataUrl
      toast.success('Image uploaded and optimized!')
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// Links
function addLink() {
  if (!resume.content.personalInfo.links) resume.content.personalInfo.links = []
  resume.content.personalInfo.links.push({ platform: '', url: '', icon: '' })
}
function removeLink(index) {
  resume.content.personalInfo.links.splice(index, 1)
}

// Experience
function addExperience() {
  if (!resume.content.experience) resume.content.experience = []
  resume.content.experience.push({ title: '', company: '', date: '', description: '', icon: '' })
}
function removeExperience(index) {
  resume.content.experience.splice(index, 1)
}

// Education
function addEducation() {
  if (!resume.content.education) resume.content.education = []
  resume.content.education.push({ degree: '', school: '', date: '', icon: '' })
}
function removeEducation(index) {
  resume.content.education.splice(index, 1)
}

// Skills (Categories)
function addSkillCategory() {
  if (!resume.content.skills) resume.content.skills = []
  resume.content.skills.push({ category: 'New Category', items: [] })
}
function removeSkillCategory(index) {
  resume.content.skills.splice(index, 1)
}
function addSkillItem(categoryIndex) {
  resume.content.skills[categoryIndex].items.push({ name: '', icon: '' })
}
function removeSkillItem(categoryIndex, itemIndex) {
  resume.content.skills[categoryIndex].items.splice(itemIndex, 1)
}

// Custom Sections
function addCustomSection() {
  if (!resume.content.customSections) resume.content.customSections = []
  const id = `custom-${Date.now()}`
  resume.content.customSections.push({ id, title: 'New Section', content: '' })
  
  // Add to order lists
  resume.content.themeConfig.sectionOrder.push(id)
  if (resume.content.themeConfig.columnAssignment) {
    resume.content.themeConfig.columnAssignment.leftColumn.push(id) // Default to left
  }
}

function removeCustomSection(index) {
  const section = resume.content.customSections[index]
  resume.content.customSections.splice(index, 1)
  
  // Remove from order lists
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
  <div class="min-h-screen bg-gray-900 text-gray-200">
    <nav class="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
      <h1 class="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Resumax Editor</h1>
      <div class="flex items-center gap-4">
        <a v-if="resume.slug" :href="`/v/${resume.slug}`" target="_blank" class="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
          <span>View Public</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button @click="handleLogout" class="text-gray-400 hover:text-white font-medium transition">Logout</button>
        <button @click="saveResume" :disabled="saving" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </nav>


    <div v-if="loading" class="p-12 text-center text-gray-500">Loading your profile...</div>

    <div v-else class="container mx-auto p-8 max-w-4xl space-y-8 pb-20">
      


      <!-- Settings -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Settings</h2>
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label class="block text-gray-400 mb-1 text-sm">Public URL Slug</label>
            <div class="flex items-center bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
               <span class="px-3 text-gray-500 text-sm">/v/</span>
               <input v-model="resume.slug" type="text" placeholder="your-name" class="bg-transparent w-full py-2 px-2 text-white outline-none active:bg-gray-800 focus:bg-gray-800 transition" />
            </div>
          </div>
        </div>
      </section>

      <!-- Theme Customization -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Theme Customization</h2>
        <ThemeCustomizer v-model="resume.content.themeConfig" :custom-sections="resume.content.customSections" />
      </section>

      <!-- Personal Info -->
      <!-- Personal Info -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Personal Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input v-model="resume.content.personalInfo.name" placeholder="Full Name" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.title" placeholder="Job Title" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.email" placeholder="Email" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.phone" placeholder="Phone" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.location" placeholder="Location" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <div class="space-y-2">
            <label class="block text-gray-400 text-sm">Profile Image</label>
            <div class="flex items-center gap-4">
              <div v-if="resume.content.personalInfo.image" class="relative group">
                <img :src="resume.content.personalInfo.image" class="w-16 h-16 rounded-full object-cover border border-gray-600" />
                <button @click="resume.content.personalInfo.image = ''" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
              <div class="flex-1">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp"
                  @change="handleImageUpload" 
                  class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                <p class="text-xs text-gray-500 mt-1">Max 400x400px, auto-compressed.</p>
              </div>
            </div>
          </div>
          
          <div class="col-span-1 md:col-span-2">
            <textarea v-model="resume.content.personalInfo.bio" placeholder="Professional Summary" rows="3" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full"></textarea>
          </div>

          <!-- Social Links -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-semibold text-gray-300">Social Links</h3>
              <button @click="addLink" class="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-2 py-1 rounded transition">+ Add Link</button>
            </div>
            <div v-for="(link, index) in resume.content.personalInfo.links" :key="index" class="flex gap-2 mb-2 items-center">
              <IconPicker v-model="link.icon" />
              <input v-model="link.platform" placeholder="Platform (e.g. GitHub)" class="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm w-32" />
              <input v-model="link.url" placeholder="URL" class="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm flex-1" />
              <button @click="removeLink(index)" class="text-gray-500 hover:text-red-400">✕</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Experience -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 class="text-xl font-bold text-white">Experience</h2>
          <button @click="addExperience" class="text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1 rounded-md transition">+ Add</button>
        </div>
        <div v-for="(exp, index) in resume.content.experience" :key="index" class="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative group">
          <button @click="removeExperience(index)" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
          
          <div class="flex gap-4 mb-3">
             <div class="mt-1">
               <IconPicker v-model="exp.icon" />
             </div>
             <div class="flex-1 space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input v-model="exp.title" placeholder="Job Title" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
                  <input v-model="exp.company" placeholder="Company" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
                  <input v-model="exp.date" placeholder="Date Range" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
                </div>
                <textarea v-model="exp.description" placeholder="Description" rows="2" class="w-full bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500"></textarea>
             </div>
          </div>
        </div>
      </section>

      <!-- Education -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 class="text-xl font-bold text-white">Education</h2>
          <button @click="addEducation" class="text-sm bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 py-1 rounded-md transition">+ Add</button>
        </div>
        <div v-for="(edu, index) in resume.content.education" :key="index" class="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative group">
          <button @click="removeEducation(index)" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
          
          <div class="flex gap-4">
             <div class="mt-1">
               <IconPicker v-model="edu.icon" />
             </div>
             <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input v-model="edu.school" placeholder="School" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
                <input v-model="edu.degree" placeholder="Degree" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
                <input v-model="edu.date" placeholder="Year" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
             </div>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
         <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 class="text-xl font-bold text-white">Skills</h2>
          <button @click="addSkillCategory" class="text-sm bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1 rounded-md transition">+ Add Category</button>
        </div>

        <div class="space-y-6">
           <!-- Category Migration notice if using old format -->
           <div v-if="resume.content.skills.length > 0 && !resume.content.skills[0].items" class="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-500 text-sm">
             Old skill format detected. Please delete existing skills and re-add them with categories.
           </div>

           <div v-else v-for="(cat, catIndex) in resume.content.skills" :key="catIndex" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
             <div class="flex justify-between items-center mb-3">
               <input v-model="cat.category" placeholder="Category Name (e.g. Frontend)" class="bg-transparent text-lg font-bold text-white outline-none placeholder-gray-600" />
               <button @click="removeSkillCategory(catIndex)" class="text-gray-500 hover:text-red-400 text-sm">Remove Category</button>
             </div>
             
             <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               <div v-for="(item, itemIndex) in cat.items" :key="itemIndex" class="flex gap-2 items-center bg-gray-800 p-2 rounded border border-gray-700 group relative">
                  <IconPicker v-model="item.icon" />
                  <input v-model="item.name" placeholder="Skill Name" class="bg-transparent text-white text-sm outline-none w-full" />
                  <button @click="removeSkillItem(catIndex, itemIndex)" class="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-xs text-red-400">✕</button>
               </div>
               <button @click="addSkillItem(catIndex)" class="flex gap-2 items-center justify-center p-2 rounded border border-gray-700 border-dashed text-gray-500 hover:text-green-400 hover:border-green-500/50 transition text-sm">
                 + Add Skill
               </button>
             </div>
           </div>
        </div>
      </section>

      <!-- Custom Sections -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 class="text-xl font-bold text-white">Custom Sections</h2>
          <button @click="addCustomSection" class="text-sm bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 px-3 py-1 rounded-md transition">+ Add Section</button>
        </div>
        
        <div v-if="resume.content.customSections && resume.content.customSections.length === 0" class="text-gray-500 text-sm text-center py-4">
          Add custom sections for anything else (e.g. Languages, Projects, Certifications).
        </div>

        <div v-for="(section, index) in resume.content.customSections" :key="index" class="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative group">
          <button @click="removeCustomSection(index)" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
          
          <div class="space-y-4">
             <input v-model="section.title" placeholder="Section Title (e.g. Projects)" class="bg-transparent text-lg font-bold text-white outline-none placeholder-gray-600 w-full" />
             <textarea v-model="section.content" placeholder="Content... (Markdown supported)" rows="4" class="w-full bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-pink-500"></textarea>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
