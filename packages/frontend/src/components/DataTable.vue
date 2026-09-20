<script setup lang="ts">
export interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any, row: any) => string | number
}

interface Props {
  columns: Column[]
  rows: any[]
  loading?: boolean
  emptyText?: string
  page?: number
  totalPages?: number
  total?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'No records found',
  page: 1,
  totalPages: 1,
  total: 0,
})

const emit = defineEmits<{
  (e: 'page-change', newPage: number): void
}>()

function onPrev() {
  if (props.page > 1) {
    emit('page-change', props.page - 1)
  }
}

function onNext() {
  if (props.page < props.totalPages) {
    emit('page-change', props.page + 1)
  }
}
</script>

<template>
  <div class="w-full bg-gray-800 border border-gray-700/80 rounded-2xl shadow-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-gray-700 bg-gray-900/60 text-gray-300 text-xs uppercase tracking-wider font-semibold">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3.5 px-4',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/60 text-gray-300">
          <tr v-if="loading">
            <td :colspan="columns.length" class="py-12 text-center text-gray-400">
              <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Loading records...</span>
            </td>
          </tr>

          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length" class="py-10 text-center text-gray-400">
              {{ emptyText }}
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, idx) in rows"
            :key="row.id || idx"
            class="hover:bg-gray-750 hover:bg-gray-700/30 transition duration-150"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3.5 px-4',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
              ]"
            >
              <!-- Named column slot for custom cell templates -->
              <slot :name="col.key" :row="row" :value="row[col.key]">
                <span>
                  {{ col.formatter ? col.formatter(row[col.key], row) : (row[col.key] ?? '—') }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="totalPages > 1 || total > 0"
      class="px-4 py-3 border-t border-gray-700/60 bg-gray-900/40 flex items-center justify-between text-xs text-gray-400"
    >
      <div>
        <span>Total: <strong class="text-white font-semibold">{{ total }}</strong> entries</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="onPrev"
          :disabled="page <= 1"
          class="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
        >
          Previous
        </button>

        <span class="px-2 font-medium">Page {{ page }} of {{ totalPages }}</span>

        <button
          @click="onNext"
          :disabled="page >= totalPages"
          class="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
