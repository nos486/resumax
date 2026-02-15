import { ref, onMounted, reactive } from 'vue'
import { api } from '../lib/api'
import { toast } from '../lib/toast'

const loading = ref(true)
const saving = ref(false)
const resume = reactive({
  slug: '',
  theme: 'modern',
  content: {
    personalInfo: { name: '', title: '', bio: '', email: '', phone: '', location: '' },
    experience: [],
    education: [],
    skills: []
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

function addExperience() {
  resume.content.experience.push({ title: '', company: '', date: '', description: '' })
}

function removeExperience(index) {
  resume.content.experience.splice(index, 1)
}

function addEducation() {
  resume.content.education.push({ degree: '', school: '', date: '' })
}

function removeEducation(index) {
  resume.content.education.splice(index, 1)
}

function addSkill() {
  resume.content.skills.push({ name: '' })
}

function removeSkill(index) {
  resume.content.skills.splice(index, 1)
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-gray-400 mb-1 text-sm">Public URL Slug</label>
            <div class="flex items-center bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
               <span class="px-3 text-gray-500 text-sm">/v/</span>
               <input v-model="resume.slug" type="text" placeholder="your-name" class="bg-transparent w-full py-2 px-2 text-white outline-none active:bg-gray-800 focus:bg-gray-800 transition" />
            </div>
          </div>
          <div>
            <label class="block text-gray-400 mb-1 text-sm">Theme</label>
            <select v-model="resume.theme" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white outline-none">
              <option value="modern">Modern Dark</option>
              <option value="minimal">Minimal Light</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Personal Info -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Personal Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input v-model="resume.content.personalInfo.name" placeholder="Full Name" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.title" placeholder="Job Title" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.email" placeholder="Email" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.phone" placeholder="Phone" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <input v-model="resume.content.personalInfo.location" placeholder="Location" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full" />
          <div class="col-span-1 md:col-span-2">
            <textarea v-model="resume.content.personalInfo.bio" placeholder="Professional Summary" rows="3" class="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white outline-none focus:ring-1 focus:ring-blue-500 w-full"></textarea>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <input v-model="exp.title" placeholder="Job Title" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
            <input v-model="exp.company" placeholder="Company" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
            <input v-model="exp.date" placeholder="Date Range" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500" />
          </div>
          <textarea v-model="exp.description" placeholder="Description" rows="2" class="w-full bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500"></textarea>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input v-model="edu.school" placeholder="School" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
             <input v-model="edu.degree" placeholder="Degree" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
             <input v-model="edu.date" placeholder="Year" class="bg-gray-800 border-none rounded py-2 px-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-purple-500" />
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
         <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 class="text-xl font-bold text-white">Skills</h2>
          <button @click="addSkill" class="text-sm bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1 rounded-md transition">+ Add</button>
        </div>
        <div class="flex flex-wrap gap-3">
          <div v-for="(skill, index) in resume.content.skills" :key="index" class="relative group">
            <input v-model="skill.name" placeholder="Skill" class="bg-gray-900 border border-gray-600 rounded-full py-1 px-4 text-white placeholder-gray-600 focus:border-green-500 outline-none w-32 text-center" />
            <button @click="removeSkill(index)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
