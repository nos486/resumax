<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  resume: Object
})

const renderIcon = (name) => {
    if (!name || !icons[name]) return null
    return icons[name]
}

const themeStyles = computed(() => {
  const colors = props.resume?.customization?.colors || {}
  return {
    '--primary': colors.primary || '#000000',
    '--bg': colors.background || '#ffffff',
    '--text': colors.text || '#111827'
  }
})

const layoutOrder = computed(() => {
  return props.resume?.customization?.layout || ['summary', 'experience', 'education', 'skills']
})
</script>

<template>
  <div class="min-h-screen font-serif py-12 px-4 print:py-0 print:px-0" :style="themeStyles" style="background-color: var(--bg); color: var(--text);">
    <div class="max-w-4xl mx-auto p-8 md:p-12 shadow-lg print:shadow-none print:max-w-none" style="background-color: var(--bg);">
      
      <!-- Header -->
      <header class="border-b-2 pb-6 mb-8 flex flex-col md:flex-row gap-8 items-start" style="border-color: var(--primary);">
        <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-32 h-32 object-cover grayscale border" style="border-color: var(--text);" />
        <div class="flex-1">
            <h1 class="text-5xl font-bold uppercase tracking-tight mb-2" style="color: var(--primary);">{{ resume.content.personalInfo.name }}</h1>
            <p class="text-xl opacity-70 mb-4 font-sans uppercase tracking-widest">{{ resume.content.personalInfo.title }}</p>
            
            <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-sans opacity-80">
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
                <a v-for="(link, i) in resume.content.personalInfo.links" :key="i" :href="link.url" target="_blank" class="hover:underline flex items-center gap-1" style="color: var(--text);">
                    <component :is="renderIcon(link.icon)" v-if="link.icon" class="w-4 h-4" />
                    {{ link.platform }}
                </a>
            </div>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <!-- Sidebar (Left Column) -->
        <div class="md:col-span-1 space-y-8">
            <template v-for="section in layoutOrder" :key="section">
                 <!-- Summary in Sidebar -->
                 <section v-if="section === 'summary' && resume.content.personalInfo.bio">
                    <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3" style="border-color: var(--text); color: var(--primary);">Profile</h3>
                    <p class="text-sm leading-relaxed text-justify opacity-90">{{ resume.content.personalInfo.bio }}</p>
                </section>

                 <!-- Education in Sidebar -->
                <section v-if="section === 'education' && resume.content.education?.length">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3" style="border-color: var(--text); color: var(--primary);">Education</h3>
                  <div class="space-y-4">
                    <div v-for="(edu, index) in resume.content.education" :key="index">
                      <div class="font-bold">{{ edu.school }}</div>
                      <div class="text-sm italic opacity-90">{{ edu.degree }}</div>
                      <div class="text-xs opacity-60 mt-1">{{ edu.date }}</div>
                    </div>
                  </div>
                </section>

                <!-- Skills in Sidebar -->
                 <section v-if="section === 'skills' && resume.content.skills?.length">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3" style="border-color: var(--text); color: var(--primary);">Expertise</h3>
                  
                  <div v-if="resume.content.skills[0].items" class="space-y-4">
                     <div v-for="(cat, i) in resume.content.skills" :key="i">
                         <h4 class="text-xs font-bold uppercase mb-2 opacity-60">{{ cat.category }}</h4>
                         <ul class="text-sm space-y-1">
                             <li v-for="(item, j) in cat.items" :key="j" class="flex items-center gap-2">
                                 <span class="w-1.5 h-1.5 rounded-full" style="background-color: var(--primary);"></span>
                                 {{ item.name }}
                             </li>
                         </ul>
                     </div>
                  </div>
                </section>
                
                <!-- Experience (if user accidentally puts it in sidebar preference? No, let's keep Experience in main column for professional theme structure, but allow reordering vertically. 
                     Wait, strict 2-column layout makes true reordering hard. 
                     For Professional theme, let's say "Layout Order" affects the vertical order within columns, but we enforce Sidebar vs Main logic.
                     Actually, to respect user wish, I'll put Dynamic Sections in Sidebar? No that breaks layout.
                     
                     Compromise: In Professional Theme, "Layout" controls vertical order, but we stick to the 2-column split:
                     Sidebar: Summary, Education, Skills
                     Main: Experience
                     
                     Let's iterate the layoutOrder, but only render if it BELONGS in sidebar.
                     Then iterate layoutOrder again for Main column.
                -->
            </template>
        </div>

        <!-- Main Content (Right Column) -->
        <div class="md:col-span-2 space-y-8">
            <template v-for="section in layoutOrder" :key="section">
                <!-- Experience in Main -->
                <section v-if="section === 'experience' && resume.content.experience?.length">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-4" style="border-color: var(--text); color: var(--primary);">Professional Experience</h3>
                  <div class="space-y-6">
                    <div v-for="(exp, index) in resume.content.experience" :key="index">
                       <div class="flex justify-between items-baseline mb-1">
                         <h4 class="text-lg font-bold" style="color: var(--primary);">{{ exp.title }}</h4>
                         <span class="text-sm font-sans opacity-60">{{ exp.date }}</span>
                       </div>
                       <div class="font-semibold mb-2 flex items-center gap-2 opacity-90">
                           <component :is="renderIcon(exp.icon)" v-if="exp.icon" class="w-4 h-4" />
                           {{ exp.company }}
                       </div>
                       <p class="text-sm leading-relaxed whitespace-pre-line opacity-80">{{ exp.description }}</p>
                    </div>
                  </div>
                </section>
                
                <!-- Render other sections if they weren't in sidebar?
                     For now, let's keep the Professional Theme opinionated: 
                     Sidebar = Bio, Education, Skills
                     Main = Experience
                     But respecting the *relative* order if multiple items were in the same column.
                -->
            </template>
        </div>
      </div>

    </div>
  </div>
</template>
