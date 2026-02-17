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
  <div class="min-h-screen bg-white font-sans text-gray-800">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row min-h-screen shadow-2xl">
      
      <!-- Left Sidebar -->
      <aside class="w-full md:w-1/3 bg-gray-100 p-8 flex flex-col gap-10 border-r border-gray-200">
          
          <!-- Profile Header -->
          <div class="text-center">
              <div class="relative inline-block mb-6">
                <!-- Avatar -->
                <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" 
                     class="w-48 h-48 rounded-full object-cover border-4 border-white shadow-md mx-auto" />
                <div v-else class="w-48 h-48 rounded-full bg-teal-100 flex items-center justify-center mx-auto border-4 border-white text-teal-600 shadow-md">
                    <span class="text-6xl font-bold">{{ resume.content.personalInfo.name.charAt(0) }}</span>
                </div>
              </div>
              
              <h1 class="text-4xl font-bold text-teal-700 tracking-tight leading-tight mb-2">
                {{ resume.content.personalInfo.name.split(' ')[0] }} 
                <span class="font-light text-gray-600">{{ resume.content.personalInfo.name.split(' ').slice(1).join(' ') }}</span>
              </h1>
              <p class="text-xl text-gray-500 font-medium tracking-wide flex items-center justify-center gap-2">
                  <span class="text-teal-600 font-bold">{ }</span> {{ resume.content.personalInfo.title }}
              </p>
          </div>

          <!-- Contact -->
          <div class="space-y-4">
              <h2 class="text-teal-800 text-xl font-bold border-b-2 border-teal-200 pb-2 mb-4">Contact</h2>
              
              <div class="flex flex-col gap-3 text-sm text-gray-600">
                  <div v-if="resume.content.personalInfo.location" class="flex items-center gap-3">
                      <component :is="renderIcon('MapPin')" class="w-5 h-5 text-teal-600" />
                      {{ resume.content.personalInfo.location }}
                  </div>
                  <div v-if="resume.content.personalInfo.email" class="flex items-center gap-3">
                      <component :is="renderIcon('Mail')" class="w-5 h-5 text-teal-600" />
                      {{ resume.content.personalInfo.email }}
                  </div>
                   <div v-if="resume.content.personalInfo.phone" class="flex items-center gap-3">
                      <component :is="renderIcon('Phone')" class="w-5 h-5 text-teal-600" />
                      {{ resume.content.personalInfo.phone }}
                  </div>

                  <!-- Links -->
                  <a v-for="(link, i) in resume.content.personalInfo.links" :key="i" :href="link.url" target="_blank" class="flex items-center gap-3 hover:text-teal-700 transition">
                       <component :is="renderIcon(link.icon)" v-if="link.icon" class="w-5 h-5 text-teal-600" />
                       <component :is="renderIcon('Link')" v-else class="w-5 h-5 text-teal-600" />
                       {{ link.platform }}
                  </a>
              </div>
          </div>

          <!-- Education -->
          <div v-if="resume.content.education?.length">
               <h2 class="text-teal-800 text-xl font-bold border-b-2 border-teal-200 pb-2 mb-4">Education</h2>
               <div class="space-y-6">
                   <div v-for="(edu, index) in resume.content.education" :key="index">
                       <h3 class="font-bold text-teal-700 text-lg">{{ edu.school }}</h3>
                       <div class="text-gray-800 font-medium mb-1">{{ edu.degree }}</div>
                       <span class="inline-block bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                           📅 {{ edu.date }}
                       </span>
                   </div>
               </div>
          </div>

      </aside>

      <!-- Right Content -->
      <main class="w-full md:w-2/3 p-8 md:p-12 space-y-10">
          
          <!-- About -->
          <section v-if="resume.content.personalInfo.bio">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">About</h2>
               <p class="text-gray-600 leading-relaxed text-justify">{{ resume.content.personalInfo.bio }}</p>
          </section>

          <!-- Experience -->
          <section v-if="resume.content.experience?.length">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">Experience</h2>
              <div class="space-y-8">
                  <div v-for="(exp, index) in resume.content.experience" :key="index" class="relative">
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                           <h3 class="text-xl font-bold text-teal-700 flex items-center gap-2">
                               <component :is="renderIcon(exp.icon)" v-if="exp.icon" class="w-5 h-5" />
                               {{ exp.title }}
                           </h3>
                           <span class="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                               {{ exp.date }}
                           </span>
                      </div>
                      <div class="text-gray-700 font-bold mb-2">{{ exp.company }}</div>
                      <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ exp.description }}</p>
                  </div>
              </div>
          </section>

          <!-- Skills -->
           <section v-if="resume.content.skills?.length">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">Skills</h2>
              
               <div v-if="resume.content.skills[0].items" class="space-y-6">
                 <div v-for="(cat, i) in resume.content.skills" :key="i">
                     <h3 class="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                         <component :is="renderIcon('Cpu')" class="w-5 h-5 text-gray-400" />
                         {{ cat.category }}
                     </h3>
                     <div class="flex flex-wrap gap-2">
                        <span v-for="(item, j) in cat.items" :key="j" class="bg-teal-500 hover:bg-teal-600 transition text-white px-3 py-1 rounded-md text-sm font-semibold shadow-sm flex items-center gap-1">
                             <component :is="renderIcon(item.icon)" v-if="item.icon" class="w-3 h-3" />
                            {{ item.name }}
                        </span>
                   </div>
                 </div>
               </div>
               
               <!-- Fallback -->
               <div v-else class="flex flex-wrap gap-2">
                    <span v-for="(skill, index) in resume.content.skills" :key="index" class="bg-teal-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                    {{ skill.name }}
                    </span>
               </div>
          </section>

      </main>

    </div>
  </div>
</template>
