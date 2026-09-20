import { z } from 'zod'

// ─── Sanitization Helpers ───────────────────────────────────────────────────

/**
 * Validates and sanitizes a URL string.
 * Strips dangerous protocols (e.g. javascript:, vbscript:, data:text/html)
 * to prevent Stored XSS attacks via resume links or image sources.
 */
export function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Disallow javascript:, vbscript:, and harmful data URIs
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return ''
  }

  return trimmed
}

// ─── Sub-schemas ────────────────────────────────────────────────────────────

export const LinkItemSchema = z.object({
  platform: z.string().default(''),
  url: z.string().transform(sanitizeUrl).default(''),
  icon: z.string().optional().default('Link'),
})

export const PersonalInfoSchema = z.object({
  name: z.string().default(''),
  title: z.string().default(''),
  bio: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  image: z.string().transform(sanitizeUrl).default(''),
  links: z.array(LinkItemSchema).default([]),
})

export const ExperienceItemSchema = z.object({
  title: z.string().default(''),
  company: z.string().default(''),
  date: z.string().default(''),
  description: z.string().default(''),
  icon: z.string().optional().default('Briefcase'),
})

export const EducationItemSchema = z.object({
  degree: z.string().default(''),
  school: z.string().default(''),
  date: z.string().default(''),
  icon: z.string().optional().default('GraduationCap'),
})

export const CertificationItemSchema = z.object({
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  url: z.string().transform(sanitizeUrl).optional().default(''),
})

export const SkillItemSchema = z.union([
  z.object({
    name: z.string().default(''),
    icon: z.string().optional().default(''),
  }),
  z.string(),
])

export const SkillCategorySchema = z.object({
  category: z.string().default(''),
  items: z.array(SkillItemSchema).default([]),
})

export const CustomSectionSchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  content: z.string().default(''),
})

export const ThemeColorsSchema = z.object({
  primary: z.string().default('#3b82f6'),
  secondary: z.string().default('#8b5cf6'),
  background: z.string().default('#f3f4f6'),
  surface: z.string().default('#ffffff'),
  text: z.string().default('#1f2937'),
  textSecondary: z.string().default('#6b7280'),
  accent: z.string().default('#3b82f6'),
  sectionTitle: z.string().optional().default('#3b82f6'),
}).passthrough()

export const ThemeConfigSchema = z.object({
  colors: ThemeColorsSchema.default({}),
  font: z.string().default('Inter'),
  layout: z.string().default('1-column'),
  direction: z.enum(['ltr', 'rtl']).optional().default('ltr'),
  sectionOrder: z.array(z.string()).default([
    'bio',
    'experience',
    'education',
    'certifications',
    'skills',
  ]),
  borderRadius: z.string().optional().default('rounded'),
  showIcons: z.boolean().optional().default(true),
  sectionStyles: z.record(z.string()).optional(),
}).passthrough()

// ─── Main Resume Content Schema ─────────────────────────────────────────────

export const ResumeContentSchema = z.object({
  personalInfo: PersonalInfoSchema.default({}),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  skills: z.array(SkillCategorySchema).default([]),
  customSections: z.array(CustomSectionSchema).default([]),
  themeConfig: ThemeConfigSchema.default({}),
}).passthrough()

// ─── Route Input Validation Schemas ─────────────────────────────────────────

export const UpdateResumeInputSchema = z.object({
  content: ResumeContentSchema,
  theme: z.string().min(1).default('modern'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .or(z.literal('')),
})

export const SlugParamSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/),
})

// ─── Public & Entity Types ──────────────────────────────────────────────────

export type LinkItem = z.infer<typeof LinkItemSchema>
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>
export type EducationItem = z.infer<typeof EducationItemSchema>
export type CertificationItem = z.infer<typeof CertificationItemSchema>
export type SkillItem = z.infer<typeof SkillItemSchema>
export type SkillCategory = z.infer<typeof SkillCategorySchema>
export type CustomSection = z.infer<typeof CustomSectionSchema>
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>
export type ResumeContent = z.infer<typeof ResumeContentSchema>
export type UpdateResumeInput = z.infer<typeof UpdateResumeInputSchema>

export interface ResumeRecord {
  id: number
  user_id: number
  slug: string
  content: ResumeContent
  theme: string
  updated_at: number
}

export interface PublicResumeResponse {
  slug: string
  content: ResumeContent
  theme: string
  updated_at: number
}

export interface AuthUser {
  id: number
  email: string
}

/**
 * Deep sanitizes all URLs and properties of a resume content object.
 */
export function sanitizeResumeContent(content: unknown): ResumeContent {
  const parsed = ResumeContentSchema.safeParse(content)
  if (parsed.success) {
    return parsed.data
  }
  // Return default safe structure if invalid
  return ResumeContentSchema.parse({})
}
