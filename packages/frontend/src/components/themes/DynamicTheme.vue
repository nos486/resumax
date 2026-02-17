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

// Function to get section card classes (for education, certifications)
const getSectionCardClass = (sectionType) => {
  const style = config.value.sectionStyles?.[sectionType] || 'card'
  
  const styles = {
    card: 'bg-surface p-3 md:p-4 rounded-lg border border-gray-200 hover:shadow-md transition',
    simple: 'py-2',
    bordered: 'p-3 md:p-4 border border-gray-300 rounded',
    minimal: 'py-3 border-b border-gray-100 last:border-b-0'
  }
  
  return styles[style] || styles.card
}

// Function to get experience item classes
const getExperienceItemClass = () => {
  const style = config.value.sectionStyles?.experience || 'timeline'
  
  const styles = {
    timeline: 'relative pl-6 border-l-2 border-accent',
    simple: 'py-3',
    card: 'bg-surface p-4 rounded-lg border border-gray-200 hover:shadow-md transition',
    minimal: 'py-3 border-b border-gray-100 last:border-b-0'
  }
  
  return styles[style] || styles.timeline
}

// Function to check if experience should show timeline dot
const showExperienceDot = () => {
  const style = config.value.sectionStyles?.experience || 'timeline'
  return style === 'timeline'
}

// Function to get skill badge classes
const getSkillBadgeClass = () => {
  const style = config.value.sectionStyles?.skills || 'badges'
  
  const styles = {
    badges: 'skill-badge text-xs',
    simple: 'text-sm text-content',
    outlined: 'px-3 py-1 text-xs border border-accent text-accent rounded-full',
    minimal: 'text-xs text-secondary'
  }
  
  return styles[style] || styles.badges
}

// Function to get skill container class
const getSkillContainerClass = () => {
  const style = config.value.sectionStyles?.skills || 'badges'
  
  if (style === 'simple' || style === 'minimal') {
    return 'space-y-1'
  }
  return 'flex flex-wrap gap-2'
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
  sectionOrder: ['bio', 'experience', 'education', 'certifications', 'skills'],
  borderRadius: 'rounded',
  showIcons: true
}

const config = computed(() => {
  const merged = { 
    ...defaultConfig, 
    ...(props.resume.content?.themeConfig || {})
  }
  
  // Robustness: Always ensure certifications is in sectionOrder if data exists
  if (props.resume.content?.certifications?.length > 0 && !merged.sectionOrder.includes('certifications')) {
    const eduIdx = merged.sectionOrder.indexOf('education')
    if (eduIdx > -1) {
      merged.sectionOrder.splice(eduIdx + 1, 0, 'certifications')
    } else {
      merged.sectionOrder.push('certifications')
    }
  }

  // Robustness: Ensure custom sections are in sectionOrder
  if (props.resume.content?.customSections?.length > 0) {
    props.resume.content.customSections.forEach(s => {
      if (!merged.sectionOrder.includes(s.id)) {
        merged.sectionOrder.push(s.id)
      }
    })
  }

  // Ensure columnAssignment exists and includes sections
  if (!merged.columnAssignment) {
    merged.columnAssignment = {
      leftColumn: ['bio', 'skills', 'certifications'],
      rightColumn: ['experience', 'education']
    }
  } else {
    // Ensure certifications is in one of the columns if it exists
    if (props.resume.content?.certifications?.length > 0) {
      const inColumns = merged.columnAssignment.leftColumn.includes('certifications') || 
                        merged.columnAssignment.rightColumn.includes('certifications')
      if (!inColumns) {
        merged.columnAssignment.leftColumn.push('certifications')
      }
    }
    // Ensure custom sections are in columns
    if (props.resume.content?.customSections?.length > 0) {
      props.resume.content.customSections.forEach(s => {
        const inColumns = merged.columnAssignment.leftColumn.includes(s.id) || 
                          merged.columnAssignment.rightColumn.includes(s.id)
        if (!inColumns) {
          merged.columnAssignment.leftColumn.push(s.id)
        }
      })
    }
  }

  return merged
})

const cssVars = computed(() => ({
  '--color-primary': config.value.colors.primary,
  '--color-secondary': config.value.colors.secondary,
  '--color-background': config.value.colors.background,
  '--color-surface': config.value.colors.surface,
  '--color-text': config.value.colors.text,
  '--color-text-secondary': config.value.colors.textSecondary,
  '--color-accent': config.value.colors.accent,
  '--color-section-title': config.value.colors.sectionTitle || config.value.colors.accent, // Fallback to accent
  '--font-family': config.value.font === 'Inter' ? 'Inter, sans-serif' :
                   config.value.font === 'Roboto' ? 'Roboto, sans-serif' :
                   config.value.font === 'Merriweather' ? 'Merriweather, serif' :
                   config.value.font === 'Playfair Display' ? '"Playfair Display", serif' :
                   config.value.font === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'Inter, sans-serif'
}))

const borderClass = computed(() => config.value.borderRadius === 'rounded' ? 'md:rounded-2xl' : 'rounded-none')

const renderSection = (sectionId) => {
  const section = sectionId
  const content = props.resume.content
  
  if (section === 'bio' && content.personalInfo?.bio) {
    return { type: 'bio', data: content.personalInfo.bio }
  }
  if (section === 'experience' && content.experience?.length) {
    return { type: 'experience', data: content.experience }
  }
  if (section === 'education' && content.education?.length) {
    return { type: 'education', data: content.education }
  }
  if (section === 'skills' && content.skills?.length) {
    return { type: 'skills', data: content.skills }
  }
  if (section === 'certifications' && content.certifications?.length) {
    return { type: 'certifications', data: content.certifications }
  }
  if (section.startsWith('custom-') && content.customSections) {
    const customSection = content.customSections.find(s => s.id === section)
    if (customSection) {
      return { type: 'custom', data: customSection }
    }
  }
  return null
}
</script>

<template>
  <div :style="cssVars" class="dynamic-theme min-h-full">
    <div class="w-full overflow-hidden" :class="borderClass">
      
      <!-- Header -->
      <header class="header-gradient text-white p-8">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <img v-if="resume.content.personalInfo.image" :src="resume.content.personalInfo.image" class="w-48 h-48 md:w-40 md:h-40 rounded-full border-4 border-white/30 md:border-0 object-cover shadow-sm" />
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

      <!-- 1-Column Layout (Mobile & Desktop if selected) -->
      <div v-if="true" class="content-background p-8 space-y-8" :class="{ 'md:hidden': config.layout === '2-column' }">
        <template v-for="section in config.sectionOrder" :key="section">
          <component :is="'div'" v-if="renderSection(section)">
            <section v-if="renderSection(section).type === 'bio'">
              <h2 class="section-heading">About Me</h2>
              <p class="text-content leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data }}</p>
            </section>

            <section v-else-if="renderSection(section).type === 'experience'">
              <h2 class="section-heading">Experience</h2>
              <div class="space-y-6">
                <div v-for="(exp, index) in renderSection(section).data" :key="index" :class="getExperienceItemClass()">
                  <div v-if="showExperienceDot()" class="absolute -left-[9px] top-0 w-4 h-4 rounded-full accent-dot"></div>
                  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                    <h3 class="text-lg font-bold text-primary flex items-center gap-2">
                      <component :is="renderIcon(exp.icon)" v-if="config.showIcons && exp.icon" class="w-4 h-4" />
                      {{ exp.title }}
                    </h3>
                    <span class="text-sm text-secondary font-medium">{{ exp.date }}</span>
                  </div>
                  <div class="text-accent font-medium mb-2">{{ exp.company }}</div>
                  <p class="text-content text-sm whitespace-pre-line break-words text-justify hyphens-auto">{{ exp.description }}</p>
                </div>
              </div>
            </section>

            <section v-else-if="renderSection(section).type === 'education'">
              <h2 class="section-heading">Education</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(edu, index) in renderSection(section).data" :key="index" :class="getSectionCardClass('education')">
                  <h3 class="font-bold text-primary flex items-center gap-2">
                    <component :is="renderIcon(edu.icon)" v-if="config.showIcons && edu.icon" class="w-4 h-4" />
                    {{ edu.school }}
                  </h3>
                  <div class="text-content text-sm">{{ edu.degree }}</div>
                  <div class="text-secondary text-xs mt-1">{{ edu.date }}</div>
                </div>
              </div>
            </section>

            <section v-else-if="renderSection(section).type === 'skills'">
              <h2 class="section-heading">Skills</h2>
              <!-- Categorized format -->
              <div v-if="renderSection(section).data[0]?.items" class="space-y-6">
                <div v-for="(cat, i) in renderSection(section).data" :key="i">
                  <h3 class="text-lg font-semibold text-primary mb-2">{{ cat.category }}</h3>
                  <div :class="getSkillContainerClass()">
                    <span v-for="(item, j) in cat.items" :key="j" :class="getSkillBadgeClass()">
                      <component :is="renderIcon(item.icon)" v-if="config.showIcons && item.icon && config.sectionStyles?.skills !== 'simple' && config.sectionStyles?.skills !== 'minimal'" class="w-3 h-3" />
                      {{ item.name }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Legacy flat format -->
              <div v-else class="flex flex-wrap gap-2">
                <span v-for="(item, j) in renderSection(section).data" :key="j" class="skill-badge">
                  <component :is="renderIcon(item.icon)" v-if="config.showIcons && item.icon" class="w-3 h-3" />
                  {{ item.name || item }}
                </span>
              </div>
            </section>

            <section v-else-if="renderSection(section).type === 'certifications'">
              <h2 class="section-heading">Licenses & Certifications</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(cert, index) in renderSection(section).data" :key="index" class="bg-surface p-4 rounded-lg border border-gray-200">
                   <h3 class="font-bold text-primary">{{ cert.name }}</h3>
                   <div class="text-accent text-sm font-medium">{{ cert.issuer }}</div>
                   <div class="text-secondary text-xs mt-1">{{ cert.date }}</div>
                   <a v-if="cert.url" :href="cert.url" target="_blank" class="text-xs text-blue-500 hover:underline mt-2 inline-block">View Credential ↗</a>
                </div>
              </div>
            </section>

            <section v-else-if="renderSection(section).type === 'custom'">
              <h2 class="section-heading">{{ renderSection(section).data.title }}</h2>
              <div class="text-content leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data.content }}</div>
            </section>
          </component>
        </template>
      </div>

      <!-- 2-Column Layout (Desktop only if selected) -->
      <div v-if="config.layout === '2-column'" class="content-background p-8 hidden md:block">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Left Column -->
          <div class="md:col-span-1 space-y-6">
            <template v-for="section in config.columnAssignment.leftColumn" :key="section">
              <component :is="'div'" v-if="renderSection(section)">
                <section v-if="renderSection(section).type === 'bio'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">About</h3>
                  <p class="text-sm leading-relaxed text-content whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data }}</p>
                </section>

                <section v-else-if="renderSection(section).type === 'education'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Education</h3>
                  <div class="space-y-3">
                    <div v-for="(edu, index) in renderSection(section).data" :key="index" :class="getSectionCardClass('education')">
                      <div class="font-bold text-primary text-sm flex items-center gap-2">
                        <component :is="renderIcon(edu.icon)" v-if="config.showIcons && edu.icon" class="w-4 h-4" />
                        {{ edu.school }}
                      </div>
                      <div class="text-xs text-content mt-1">{{ edu.degree }}</div>
                      <div class="text-xs text-secondary mt-1">{{ edu.date }}</div>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'skills'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Skills</h3>
                  <div v-if="renderSection(section).data[0]?.items" class="space-y-4">
                    <div v-for="(cat, i) in renderSection(section).data" :key="i">
                      <h4 class="text-xs font-bold text-primary mb-2">{{ cat.category }}</h4>
                      <div :class="getSkillContainerClass()">
                        <span v-for="(item, j) in cat.items" :key="j" :class="getSkillBadgeClass()">
                          <component :is="renderIcon(item.icon)" v-if="config.showIcons && item.icon && config.sectionStyles?.skills !== 'simple' && config.sectionStyles?.skills !== 'minimal'" class="w-3 h-3" />
                          {{ item.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'certifications'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Certifications</h3>
                  <div class="space-y-3">
                    <div v-for="(cert, index) in renderSection(section).data" :key="index" :class="getSectionCardClass('certifications')">
                      <div class="font-bold text-primary text-sm">{{ cert.name }}</div>
                      <div class="text-xs text-accent mt-1">{{ cert.issuer }}</div>
                      <div class="text-xs text-secondary mt-1">{{ cert.date }}</div>
                      <a v-if="cert.url" :href="cert.url" target="_blank" class="text-[10px] text-blue-500 hover:underline mt-1 inline-block">View ↗</a>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'experience'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Experience</h3>
                  <div class="space-y-4">
                    <div v-for="(exp, index) in renderSection(section).data" :key="index" :class="getExperienceItemClass()">
                      <div v-if="showExperienceDot()" class="absolute -left-[9px] top-0 w-4 h-4 rounded-full accent-dot"></div>
                      <div class="flex flex-col mb-1">
                        <h4 class="text-sm font-bold text-primary flex items-center gap-2">
                          <component :is="renderIcon(exp.icon)" v-if="config.showIcons && exp.icon" class="w-4 h-4" />
                          {{ exp.title }}
                        </h4>
                        <span class="text-xs text-secondary font-medium">{{ exp.date }}</span>
                      </div>
                      <div class="text-accent text-xs font-semibold mb-1">{{ exp.company }}</div>
                      <p class="text-content text-xs leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ exp.description }}</p>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'custom'" class="mb-6">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">{{ renderSection(section).data.title }}</h3>
                  <div class="text-sm text-content leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data.content }}</div>
                </section>
              </component>
            </template>
          </div>

          <!-- Right Column -->
          <div class="md:col-span-2 space-y-8">
            <template v-for="section in config.columnAssignment.rightColumn" :key="section">
              <component :is="'div'" v-if="renderSection(section)">
                <section v-if="renderSection(section).type === 'experience'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-4 section-title-sm">Experience</h3>
                  <div class="space-y-6">
                    <div v-for="(exp, index) in renderSection(section).data" :key="index" :class="getExperienceItemClass()">
                      <div v-if="showExperienceDot()" class="absolute -left-[9px] top-0 w-4 h-4 rounded-full accent-dot"></div>
                      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                        <h4 class="text-lg font-bold text-primary flex items-center gap-2">
                          <component :is="renderIcon(exp.icon)" v-if="config.showIcons && exp.icon" class="w-4 h-4" />
                          {{ exp.title }}
                        </h4>
                        <span class="text-sm text-secondary font-medium">{{ exp.date }}</span>
                      </div>
                      <div class="text-accent font-semibold mb-2">{{ exp.company }}</div>
                      <p class="text-content text-sm leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ exp.description }}</p>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'bio'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">About</h3>
                  <p class="text-content leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data }}</p>
                </section>

                <section v-else-if="renderSection(section).type === 'education'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Education</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(edu, index) in renderSection(section).data" :key="index" :class="getSectionCardClass('education')">
                      <h4 class="font-bold text-primary flex items-center gap-2">
                        <component :is="renderIcon(edu.icon)" v-if="config.showIcons && edu.icon" class="w-4 h-4" />
                        {{ edu.school }}
                      </h4>
                      <div class="text-content text-sm">{{ edu.degree }}</div>
                      <div class="text-secondary text-xs mt-1">{{ edu.date }}</div>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'skills'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Skills</h3>
                  <div v-if="renderSection(section).data[0]?.items" class="space-y-6">
                    <div v-for="(cat, i) in renderSection(section).data" :key="i">
                      <h4 class="text-lg font-semibold text-primary mb-2">{{ cat.category }}</h4>
                      <div class="flex flex-wrap gap-2">
                        <span v-for="(item, j) in cat.items" :key="j" class="skill-badge">
                          <component :is="renderIcon(item.icon)" v-if="config.showIcons && item.icon" class="w-3 h-3" />
                          {{ item.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'certifications'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">Certifications</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(cert, index) in renderSection(section).data" :key="index" :class="getSectionCardClass('certifications')">
                      <h4 class="font-bold text-primary">{{ cert.name }}</h4>
                      <div class="text-accent text-sm font-medium">{{ cert.issuer }}</div>
                      <div class="text-secondary text-xs mt-1">{{ cert.date }}</div>
                      <a v-if="cert.url" :href="cert.url" target="_blank" class="text-xs text-blue-500 hover:underline mt-1 inline-block">View Credential ↗</a>
                    </div>
                  </div>
                </section>

                <section v-else-if="renderSection(section).type === 'custom'">
                  <h3 class="text-sm font-bold uppercase tracking-widest border-b pb-1 mb-3 section-title-sm">{{ renderSection(section).data.title }}</h3>
                  <div class="text-content leading-relaxed whitespace-pre-line break-words text-justify hyphens-auto">{{ renderSection(section).data.content }}</div>
                </section>
              </component>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer - Outside the resume paper -->
    <div class="text-center py-8 opacity-40 hover:opacity-100 transition-opacity">
      <p class="text-xs text-secondary">
        Built with <a href="/" class="text-accent font-bold hover:underline">Resumax</a>
      </p>
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
  color: var(--color-section-title);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-section-title);
}

.section-title-sm {
  color: var(--color-section-title);
  border-color: var(--color-section-title);
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
