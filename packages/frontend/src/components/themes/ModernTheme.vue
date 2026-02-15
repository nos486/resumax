<script setup>
import * as icons from 'lucide-vue-next'

const props = defineProps({
  resume: Object
})

const renderIcon = (name) => {
    if (!name || !icons[name]) return null
    return icons[name]
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
    <div class="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
      
      <!-- Header -->
      <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div class="flex flex-col md:flex-row items-center gap-6">
            <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-sm" />
            <div class="text-center md:text-left">
                <h1 class="text-4xl font-bold mb-2">{{ resume.content.personalInfo.name }}</h1>
                <p class="text-xl opacity-90 mb-4">{{ resume.content.personalInfo.title }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm opacity-80">
                  <span v-if="resume.content.personalInfo.email" class="flex items-center gap-1">
                      <component :is="renderIcon('Mail')" class="w-4 h-4" /> {{ resume.content.personalInfo.email }}
                  </span>
                  <span v-if="resume.content.personalInfo.phone" class="flex items-center gap-1">
                      <component :is="renderIcon('Phone')" class="w-4 h-4" /> {{ resume.content.personalInfo.phone }}
                  </span>
                  <span v-if="resume.content.personalInfo.location" class="flex items-center gap-1">
                      <component :is="renderIcon('MapPin')" class="w-4 h-4" /> {{ resume.content.personalInfo.location }}
                  </span>
                </div>
                 <!-- Social Links -->
                <div v-if="resume.content.personalInfo.links && resume.content.personalInfo.links.length" class="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                    <a v-for="(link, i) in resume.content.personalInfo.links" :key="i" :href="link.url" target="_blank" class="text-white hover:text-blue-100 transition">
                        <component :is="renderIcon(link.icon)" v-if="link.icon" class="w-5 h-5" :title="link.platform"/>
                        <span v-else>{{ link.platform }}</span>
                    </a>
                </div>
            </div>
        </div>
      </header>

      <div class="p-8 space-y-8">
        
        <!-- Bio -->
        <section v-if="resume.content.personalInfo.bio">
          <h2 class="text-2xl font-bold text-gray-800 mb-3 border-b pb-2 border-gray-200">About Me</h2>
          <p class="text-gray-600 leading-relaxed">{{ resume.content.personalInfo.bio }}</p>
        </section>

        <!-- Experience -->
        <section v-if="resume.content.experience?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Experience</h2>
          <div class="space-y-6">
            <div v-for="(exp, index) in resume.content.experience" :key="index" class="relative pl-6 border-l-2 border-blue-200">
               <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
               </div>
               <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                 <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <component :is="renderIcon(exp.icon)" v-if="exp.icon" class="w-4 h-4 text-blue-600" />
                     {{ exp.title }}
                 </h3>
                 <span class="text-sm text-gray-500 font-medium">{{ exp.date }}</span>
               </div>
               <div class="text-blue-600 font-medium mb-2">{{ exp.company }}</div>
               <p class="text-gray-600 text-sm whitespace-pre-line">{{ exp.description }}</p>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section v-if="resume.content.education?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Education</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(edu, index) in resume.content.education" :key="index" class="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition">
              <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <component :is="renderIcon(edu.icon)" v-if="edu.icon" class="w-4 h-4 text-purple-600" />
                  {{ edu.school }}
              </h3>
              <div class="text-gray-600 text-sm">{{ edu.degree }}</div>
              <div class="text-gray-400 text-xs mt-1">{{ edu.date }}</div>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section v-if="resume.content.skills?.length">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-gray-200">Skills</h2>
          
           <!-- Handle new category format -->
           <div v-if="resume.content.skills[0].items" class="space-y-6">
               <div v-for="(cat, i) in resume.content.skills" :key="i">
                   <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ cat.category }}</h3>
                   <div class="flex flex-wrap gap-2">
                        <span v-for="(item, j) in cat.items" :key="j" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 flex items-center gap-1">
                            <component :is="renderIcon(item.icon)" v-if="item.icon" class="w-3 h-3" />
                            {{ item.name }}
                        </span>
                   </div>
               </div>
           </div>

           <!-- Fallback for old flat format -->
           <div v-else class="flex flex-wrap gap-2">
            <span v-for="(skill, index) in resume.content.skills" :key="index" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
              {{ skill.name }}
            </span>
          </div>
        </section>

      </div>
    </div>
    <div class="text-center mt-8 text-gray-400 text-sm">
      Built with <a href="/" class="text-blue-500 hover:underline">Resumax</a>
    </div>
  </div>
</template>
