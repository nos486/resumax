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
  <div class="min-h-screen bg-white font-serif text-gray-900 py-12 px-4 print:py-0 print:px-0">
    <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg print:shadow-none print:max-w-none">
      
      <!-- Header -->
      <header class="border-b-2 border-gray-800 pb-6 mb-8 flex flex-col md:flex-row gap-8 items-start">
        <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-32 h-32 object-cover grayscale border border-gray-300" />
        <div class="flex-1">
            <h1 class="text-5xl font-bold uppercase tracking-tight mb-2">{{ resume.content.personalInfo.name }}</h1>
            <p class="text-xl text-gray-600 mb-4 font-sans uppercase tracking-widest">{{ resume.content.personalInfo.title }}</p>
            
            <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 font-sans">
              <span v-if="resume.content.personalInfo.email" class="flex items-center gap-2">
                  <component :is="renderIcon('Mail')" class="w-4 h-4" /> {{ resume.content.personalInfo.email }}
              </span>
              <span v-if="resume.content.personalInfo.phone" class="flex items-center gap-2">
                  <component :is="renderIcon('Phone')" class="w-4 h-4" /> {{ resume.content.personalInfo.phone }}
              </span>
               <span v-if="resume.content.personalInfo.location" class="flex items-center gap-2">
                  <component :is="renderIcon('MapPin')" class="w-4 h-4" /> {{ resume.content.personalInfo.location }}
              </span>
            </div>

            <div v-if="resume.content.personalInfo.links && resume.content.personalInfo.links.length" class="flex flex-wrap gap-4 mt-3 text-sm font-sans">
                <a v-for="(link, i) in resume.content.personalInfo.links" :key="i" :href="link.url" target="_blank" class="text-gray-800 hover:text-black hover:underline flex items-center gap-1">
                    <component :is="renderIcon(link.icon)" v-if="link.icon" class="w-4 h-4" />
                    {{ link.platform }}
                </a>
            </div>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <!-- Sidebar (Left Column) -->
        <div class="md:col-span-1 space-y-8">
            <!-- Contact Info / Bio if short -->
             <section v-if="resume.content.personalInfo.bio">
                <h3 class="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Profile</h3>
                <p class="text-sm leading-relaxed text-gray-700 text-justify">{{ resume.content.personalInfo.bio }}</p>
            </section>

             <!-- Education -->
            <section v-if="resume.content.education?.length">
              <h3 class="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Education</h3>
              <div class="space-y-4">
                <div v-for="(edu, index) in resume.content.education" :key="index">
                  <div class="font-bold text-gray-900">{{ edu.school }}</div>
                  <div class="text-sm italic text-gray-700">{{ edu.degree }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ edu.date }}</div>
                </div>
              </div>
            </section>

            <!-- Skills -->
             <section v-if="resume.content.skills?.length">
              <h3 class="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Expertise</h3>
              
              <div v-if="resume.content.skills[0].items" class="space-y-4">
                 <div v-for="(cat, i) in resume.content.skills" :key="i">
                     <h4 class="text-xs font-bold text-gray-500 uppercase mb-2">{{ cat.category }}</h4>
                     <ul class="text-sm text-gray-700 space-y-1">
                         <li v-for="(item, j) in cat.items" :key="j" class="flex items-center gap-2">
                             <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                             {{ item.name }}
                         </li>
                     </ul>
                 </div>
              </div>
            </section>
        </div>

        <!-- Main Content (Right Column) -->
        <div class="md:col-span-2 space-y-8">
            <!-- Experience -->
            <section v-if="resume.content.experience?.length">
              <h3 class="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Professional Experience</h3>
              <div class="space-y-6">
                <div v-for="(exp, index) in resume.content.experience" :key="index">
                   <div class="flex justify-between items-baseline mb-1">
                     <h4 class="text-lg font-bold text-gray-900">{{ exp.title }}</h4>
                     <span class="text-sm text-gray-500 font-sans">{{ exp.date }}</span>
                   </div>
                   <div class="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                       <component :is="renderIcon(exp.icon)" v-if="exp.icon" class="w-4 h-4" />
                       {{ exp.company }}
                   </div>
                   <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{{ exp.description }}</p>
                </div>
              </div>
            </section>
        </div>
      </div>

    </div>
  </div>
</template>
