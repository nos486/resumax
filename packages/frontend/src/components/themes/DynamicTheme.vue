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

// Default theme config
const defaultConfig = {
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
  layout: 'full-width',
  sectionOrder: ['bio', 'experience', 'education', 'skills'],
  borderRadius: 'rounded',
  showIcons: true
}

const config = computed(() => {
  return { ...defaultConfig, ...(props.resume.content?.themeConfig || {}) }
})

const cssVars = computed(() => ({
  '--color-primary': config.value.colors.primary,
  '--color-secondary': config.value.colors.secondary,
  '--color-background': config.value.colors.background,
  '--color-surface': config.value.colors.surface,
  '--color-text': config.value.colors.text,
  '--color-text-secondary': config.value.colors.textSecondary,
  '--color-accent': config.value.colors.accent,
  '--font-family': config.value.font === 'Inter' ? 'Inter, sans-serif' :
                   config.value.font === 'Roboto' ? 'Roboto, sans-serif' :
                   config.value.font === 'Merriweather' ? 'Merriweather, serif' :
                   config.value.font === 'Playfair Display' ? '"Playfair Display", serif' :
                   config.value.font === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'Inter, sans-serif'
}))

const borderClass = computed(() => config.value.borderRadius === 'rounded' ? 'rounded-2xl' : 'rounded-none')

const sectionComponents = {
  bio: 'bio-section',
  experience: 'experience-section',
  education: 'education-section',
  skills: 'skills-section'
}
</script>

<template>
  <div :style="cssVars" class="dynamic-theme min-h-screen py-12 px-4">
    <div class="max-w-4xl mx-auto shadow-xl overflow-hidden" :class="borderClass">
      
      <!-- Header -->
      <header class="header-gradient text-white p-8">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow-sm" />
          <div class="text-center md:text-left flex-1">
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
            <div v-if="resume.content.personalInfo.links?.length" class="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <a v-for="(link, i) in resume.content.personalInfo.links" :key="i" :href="link.url" target="_blank" class="text-white hover:opacity-80 transition">
                <component :is="renderIcon(link.icon)" v-if="link.icon" class="w-5 h-5" :title="link.platform"/>
                <span v-else>{{ link.platform }}</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div class="content-background p-8 space-y-8">
        <!-- Render sections in custom order -->
        <template v-for="section in config.sectionOrder" :key="section">
          
          <!-- Bio -->
          <section v-if="section === 'bio' && resume.content.personalInfo.bio">
            <h2 class="section-heading">About Me</h2>
            <p class="text-content leading-relaxed">{{ resume.content.personalInfo.bio }}</p>
          </section>

          <!-- Experience -->
          <section v-if="section === 'experience' && resume.content.experience?.length">
            <h2 class="section-heading">Experience</h2>
            <div class="space-y-6">
              <div v-for="(exp, index) in resume.content.experience" :key="index" class="relative pl-6 border-l-2 border-accent">
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full accent-dot"></div>
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                  <h3 class="text-lg font-bold text-primary flex items-center gap-2">
                    <component :is="renderIcon(exp.icon)" v-if="config.showIcons && exp.icon" class="w-4 h-4" />
                    {{ exp.title }}
                  </h3>
                  <span class="text-sm text-secondary font-medium">{{ exp.date }}</span>
                </div>
                <div class="text-accent font-medium mb-2">{{ exp.company }}</div>
                <p class="text-content text-sm whitespace-pre-line">{{ exp.description }}</p>
              </div>
            </div>
          </section>

          <!-- Education -->
          <section v-if="section === 'education' && resume.content.education?.length">
            <h2 class="section-heading">Education</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(edu, index) in resume.content.education" :key="index" class="bg-surface p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                <h3 class="font-bold text-primary flex items-center gap-2">
                  <component :is="renderIcon(edu.icon)" v-if="config.showIcons && edu.icon" class="w-4 h-4" />
                  {{ edu.school }}
                </h3>
                <div class="text-content text-sm">{{ edu.degree }}</div>
                <div class="text-secondary text-xs mt-1">{{ edu.date }}</div>
              </div>
            </div>
          </section>

          <!-- Skills -->
          <section v-if="section === 'skills' && resume.content.skills?.length">
            <h2 class="section-heading">Skills</h2>
            <div v-if="resume.content.skills[0]?.items" class="space-y-6">
              <div v-for="(cat, i) in resume.content.skills" :key="i">
                <h3 class="text-lg font-semibold text-primary mb-2">{{ cat.category }}</h3>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(item, j) in cat.items" :key="j" class="skill-badge">
                    <component :is="renderIcon(item.icon)" v-if="config.showIcons && item.icon" class="w-3 h-3" />
                    {{ item.name }}
                  </span>
                </div>
              </div>
            </div>
          </section>

        </template>
      </div>
    </div>
    
    <div class="text-center mt-8 text-secondary text-sm">
      Built with <a href="/" class="text-accent hover:underline">Resumax</a>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

.dynamic-theme {
  font-family: var(--font-family);
  background-color: var(--color-background);
  color: var(--color-text);
}

.header-gradient {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.content-background {
  background-color: var(--color-surface);
}

.section-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
}

.text-content {
  color: var(--color-text-secondary);
}

.text-primary {
  color: var(--color-text);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-accent {
  color: var(--color-accent);
}

.border-accent {
  border-color: var(--color-accent);
}

.accent-dot {
  background-color: var(--color-accent);
}

.skill-badge {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
