<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { AdminUserListItem, AdminUserDetail } from '@resumax/shared'
import Card from '../components/Card.vue'
import DataTable, { Column } from '../components/DataTable.vue'
import CVRenderer from '../components/CVRenderer.vue'
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  X, 
  ArrowLeft,
  Calendar,
  Mail,
  Palette,
  Database,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles
} from 'lucide-vue-next'

const router = useRouter()

const loading = ref(true)
const users = ref<AdminUserListItem[]>([])
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const totalPages = ref(1)

// Sorting state
const sortBy = ref('resume_updated_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Selected user for inspection drawer / modal
const selectedUserId = ref<number | null>(null)
const selectedUser = ref<AdminUserDetail | null>(null)
const loadingUserDetail = ref(false)

const columns: Column[] = [
  { key: 'email', label: 'User Email' },
  { key: 'role', label: 'Role', align: 'center' },
  { key: 'resume_status', label: 'Resume' },
  { key: 'resume_size', label: 'CV Size', align: 'right', sortable: true },
  { key: 'resume_updated_at', label: 'CV Updated', sortable: true },
  { key: 'created_at', label: 'Registered', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' },
]

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

async function loadUsers(targetPage = 1) {
  loading.value = true
  try {
    const res = await api.getAdminUsers(targetPage, limit.value, sortBy.value, sortOrder.value)
    users.value = res.data
    page.value = res.page
    total.value = res.total
    totalPages.value = res.totalPages
  } catch (err: any) {
    toast.error('Failed to load users: ' + err.message)
  } finally {
    loading.value = false
  }
}

function handleSort(colKey: string) {
  if (sortBy.value === colKey) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = colKey
    sortOrder.value = 'desc'
  }
  loadUsers(1)
}

function handlePresetSort(preset: string) {
  if (preset === 'size_desc') {
    sortBy.value = 'resume_size'
    sortOrder.value = 'desc'
  } else if (preset === 'size_asc') {
    sortBy.value = 'resume_size'
    sortOrder.value = 'asc'
  } else if (preset === 'updated_desc') {
    sortBy.value = 'resume_updated_at'
    sortOrder.value = 'desc'
  } else if (preset === 'updated_asc') {
    sortBy.value = 'resume_updated_at'
    sortOrder.value = 'asc'
  } else if (preset === 'created_desc') {
    sortBy.value = 'created_at'
    sortOrder.value = 'desc'
  }
  loadUsers(1)
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  loadUsers(1)
}

async function viewUser(userId: number) {
  selectedUserId.value = userId
  loadingUserDetail.value = true
  try {
    const res = await api.getAdminUser(userId)
    selectedUser.value = res.user
  } catch (err: any) {
    toast.error('Failed to load user CV: ' + err.message)
    selectedUserId.value = null
  } finally {
    loadingUserDetail.value = false
  }
}

function closeDetail() {
  selectedUserId.value = null
  selectedUser.value = null
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Quick stats
const totalWithResumes = computed(() => users.value.filter((u) => u.resume_slug).length)
const totalAdmins = computed(() => users.value.filter((u) => u.is_admin).length)
const largestCV = computed(() => {
  const withResumes = users.value.filter((u) => u.resume_size > 0)
  if (withResumes.length === 0) return 0
  return Math.max(...withResumes.map((u) => u.resume_size))
})

onMounted(() => {
  loadUsers(1)
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
    <!-- Admin Navbar -->
    <header class="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-xl sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <router-link
          to="/dashboard"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Back to Workspace</span>
        </router-link>

        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/30">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <div>
            <h1 class="text-base font-bold text-white leading-none">Admin Control Center</h1>
            <p class="text-xs text-gray-400 mt-0.5">Resumax Platform & User Directory</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold">
          <ShieldCheck class="w-3.5 h-3.5" />
          Admin Session Active
        </span>
      </div>
    </header>

    <!-- Content Body -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Top Metrics Cards -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card title="Total Registered Users" description="All accounts created via Google OAuth">
          <div class="flex items-center justify-between mt-2">
            <span class="text-3xl font-extrabold text-white tracking-tight">{{ total }}</span>
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users class="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Active CVs (Current Page)" description="Users who have customized their resume">
          <div class="flex items-center justify-between mt-2">
            <span class="text-3xl font-extrabold text-white tracking-tight">{{ totalWithResumes }}</span>
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText class="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Largest CV (Current Page)" description="Max payload size amongst loaded users">
          <div class="flex items-center justify-between mt-2">
            <span class="text-3xl font-extrabold text-white tracking-tight">
              {{ largestCV > 0 ? formatBytes(largestCV) : '—' }}
            </span>
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database class="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Administrators" description="Users matching ADMIN_EMAILS access list">
          <div class="flex items-center justify-between mt-2">
            <span class="text-3xl font-extrabold text-white tracking-tight">{{ totalAdmins }}</span>
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck class="w-5 h-5" />
            </div>
          </div>
        </Card>
      </section>

      <!-- Users DataTable -->
      <section class="space-y-4">
        <!-- Controls Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div>
            <h2 class="text-lg font-bold text-white">Registered Users Directory</h2>
            <p class="text-xs text-gray-400">Inspect user resumes, payloads, and timestamps across the platform</p>
          </div>

          <!-- Quick Sorting Selector -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-gray-900 border border-gray-700/80 rounded-xl px-3 py-1.5 text-xs text-gray-300">
              <SlidersHorizontal class="w-3.5 h-3.5 text-gray-400" />
              <span class="text-gray-400 font-medium">Sort by:</span>
              <select
                :value="sortBy === 'resume_size' ? (sortOrder === 'desc' ? 'size_desc' : 'size_asc') : sortBy === 'resume_updated_at' ? (sortOrder === 'desc' ? 'updated_desc' : 'updated_asc') : 'created_desc'"
                @change="handlePresetSort(($event.target as HTMLSelectElement).value)"
                class="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="updated_desc" class="bg-gray-800 text-white">Recently Updated CVs</option>
                <option value="size_desc" class="bg-gray-800 text-white">Largest CV First (Most Data)</option>
                <option value="size_asc" class="bg-gray-800 text-white">Smallest CV First</option>
                <option value="updated_asc" class="bg-gray-800 text-white">Oldest Updated CVs</option>
                <option value="created_desc" class="bg-gray-800 text-white">Newest Users</option>
              </select>
            </div>

            <button
              @click="toggleSortOrder"
              class="p-2 rounded-xl border border-gray-700/80 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white transition"
              :title="`Current order: ${sortOrder.toUpperCase()}. Click to reverse.`"
            >
              <ArrowUpDown class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <DataTable
          :columns="columns"
          :rows="users"
          :loading="loading"
          :page="page"
          :total-pages="totalPages"
          :total="total"
          :sort-by="sortBy"
          :sort-order="sortOrder"
          @page-change="loadUsers"
          @sort="handleSort"
        >
          <!-- Custom Role Cell -->
          <template #role="{ row }">
            <span
              v-if="row.is_admin"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              <ShieldCheck class="w-3 h-3" />
              Admin
            </span>
            <span v-else class="text-xs text-gray-500 font-medium">User</span>
          </template>

          <!-- Custom Resume Status Cell -->
          <template #resume_status="{ row }">
            <div v-if="row.resume_slug" class="flex items-center gap-2">
              <span class="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                /v/{{ row.resume_slug }}
              </span>
              <span class="text-xs text-gray-400">({{ row.resume_theme || 'modern' }})</span>
            </div>
            <span v-else class="text-xs text-gray-500 italic">No resume created</span>
          </template>

          <!-- Custom Resume Size Cell -->
          <template #resume_size="{ row }">
            <div v-if="row.resume_size > 0" class="flex flex-col items-end">
              <span
                class="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md border"
                :class="
                  row.resume_size > 5000
                    ? 'text-purple-300 bg-purple-950/70 border-purple-800/80 shadow-sm shadow-purple-950/50'
                    : row.resume_size > 2000
                    ? 'text-emerald-300 bg-emerald-950/70 border-emerald-800/80'
                    : 'text-blue-300 bg-blue-950/70 border-blue-800/80'
                "
                :title="`${row.resume_size.toLocaleString()} bytes`"
              >
                <Database class="w-3 h-3 opacity-70" />
                {{ formatBytes(row.resume_size) }}
              </span>
              <span class="text-[10px] text-gray-500 font-mono mt-0.5">
                {{ row.resume_size.toLocaleString() }} B
              </span>
            </div>
            <span v-else class="text-xs text-gray-600 font-mono italic">—</span>
          </template>

          <!-- Custom CV Updated Date Cell -->
          <template #resume_updated_at="{ row }">
            <span v-if="row.resume_updated_at" class="text-xs text-gray-300">
              {{ formatDate(row.resume_updated_at) }}
            </span>
            <span v-else class="text-xs text-gray-600 italic">—</span>
          </template>

          <!-- Custom Registered Date Cell -->
          <template #created_at="{ row }">
            <span class="text-xs text-gray-400">{{ formatDate(row.created_at) }}</span>
          </template>

          <!-- Custom Actions Cell -->
          <template #actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <a
                v-if="row.resume_slug"
                :href="`/v/${row.resume_slug}`"
                target="_blank"
                class="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700/60 rounded-lg transition"
                title="Open Live Public Link"
              >
                <ExternalLink class="w-4 h-4" />
              </a>

              <button
                @click="viewUser(row.id)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/60 hover:bg-blue-600 text-gray-200 hover:text-white text-xs font-medium transition"
              >
                <Eye class="w-3.5 h-3.5" />
                <span>View CV</span>
              </button>
            </div>
          </template>
        </DataTable>
      </section>
    </main>

    <!-- User CV Detail Modal / Drawer -->
    <div
      v-if="selectedUserId !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Drawer Header -->
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-850">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
              {{ selectedUser?.email?.[0]?.toUpperCase() || 'U' }}
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">{{ selectedUser?.email }}</h3>
              <p class="text-xs text-gray-400">
                User ID: {{ selectedUser?.id }} • Registered: {{ formatDate(selectedUser?.created_at || null) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a
              v-if="selectedUser?.resume_slug"
              :href="`/v/${selectedUser.resume_slug}`"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium transition"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>Public Page (/v/{{ selectedUser.resume_slug }})</span>
            </a>

            <button
              @click="closeDetail"
              class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
              title="Close modal"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Drawer Body -->
        <div class="p-6 flex-1 overflow-y-auto space-y-6">
          <div v-if="loadingUserDetail" class="py-16 text-center text-gray-400">
            <div class="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-sm">Loading user's CV details...</p>
          </div>

          <div v-else-if="selectedUser">
            <!-- Summary Info Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div class="flex items-center gap-3 p-3.5 bg-gray-800/80 rounded-xl border border-gray-700/60">
                <Palette class="w-5 h-5 text-purple-400" />
                <div>
                  <span class="text-gray-400 block text-[11px]">Theme</span>
                  <strong class="text-white capitalize text-sm">{{ selectedUser.resume_theme || 'None' }}</strong>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3.5 bg-gray-800/80 rounded-xl border border-gray-700/60">
                <Database class="w-5 h-5 text-emerald-400" />
                <div>
                  <span class="text-gray-400 block text-[11px]">CV Data Size</span>
                  <strong class="text-white text-sm">
                    {{ selectedUser.resume_size > 0 ? formatBytes(selectedUser.resume_size) : '0 B' }}
                  </strong>
                  <span class="text-[10px] text-gray-400 block">({{ (selectedUser.resume_size || 0).toLocaleString() }} bytes)</span>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3.5 bg-gray-800/80 rounded-xl border border-gray-700/60">
                <Calendar class="w-5 h-5 text-blue-400" />
                <div>
                  <span class="text-gray-400 block text-[11px]">Last Updated</span>
                  <strong class="text-white text-sm">{{ formatDate(selectedUser.resume_updated_at) }}</strong>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3.5 bg-gray-800/80 rounded-xl border border-gray-700/60">
                <Mail class="w-5 h-5 text-amber-400" />
                <div>
                  <span class="text-gray-400 block text-[11px]">Account Role</span>
                  <strong class="text-white text-sm">{{ selectedUser.is_admin ? 'Administrator' : 'Standard User' }}</strong>
                </div>
              </div>
            </div>

            <!-- Content Density Breakdown Badge Bar -->
            <div v-if="selectedUser.resume_content" class="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <Layers class="w-4 h-4 text-purple-400" />
                <h4 class="text-xs font-semibold text-gray-200 uppercase tracking-wider">CV Data & Content Density</h4>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-2.5 rounded-lg bg-gray-900/60 border border-gray-700/40 flex items-center gap-2.5">
                  <Briefcase class="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[10px]">Work Experience</span>
                    <strong class="text-white font-mono text-sm">
                      {{ selectedUser.resume_content.experience?.length || 0 }} entries
                    </strong>
                  </div>
                </div>

                <div class="p-2.5 rounded-lg bg-gray-900/60 border border-gray-700/40 flex items-center gap-2.5">
                  <GraduationCap class="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[10px]">Education</span>
                    <strong class="text-white font-mono text-sm">
                      {{ selectedUser.resume_content.education?.length || 0 }} entries
                    </strong>
                  </div>
                </div>

                <div class="p-2.5 rounded-lg bg-gray-900/60 border border-gray-700/40 flex items-center gap-2.5">
                  <Sparkles class="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[10px]">Skill Categories</span>
                    <strong class="text-white font-mono text-sm">
                      {{ selectedUser.resume_content.skills?.length || 0 }} categories
                    </strong>
                  </div>
                </div>

                <div class="p-2.5 rounded-lg bg-gray-900/60 border border-gray-700/40 flex items-center gap-2.5">
                  <Award class="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span class="text-gray-400 block text-[10px]">Certifications</span>
                    <strong class="text-white font-mono text-sm">
                      {{ selectedUser.resume_content.certifications?.length || 0 }} certificates
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rendered CV using shared CVRenderer -->
            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live CV Preview</h4>
              <div v-if="selectedUser.resume_content" class="border border-gray-700 rounded-xl overflow-hidden bg-white shadow-2xl">
                <CVRenderer
                  :content="selectedUser.resume_content"
                  :theme="selectedUser.resume_theme || 'modern'"
                  :slug="selectedUser.resume_slug || ''"
                />
              </div>
              <div v-else class="p-8 text-center bg-gray-800/50 rounded-xl border border-gray-700/50 text-gray-400 text-sm">
                This user has not created or saved a resume yet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
