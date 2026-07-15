<template>
  <div class="card border-l-4 border-red-500">
    <div class="p-6">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-lg">
            {{ formatDateRange(block.startDate, block.endDate) }}
          </h3>
          <p v-if="block.startTime && block.endTime" class="text-sm text-gray-600">
            {{ block.startTime }} – {{ block.endTime }}
          </p>
          <p v-else class="text-sm text-gray-600">All day</p>
        </div>
        <span class="badge badge-danger">Unavailable</span>
      </div>

      <div v-if="block.reason" class="mb-4 p-3 bg-red-50 rounded">
        <p class="text-sm text-gray-700">{{ block.reason }}</p>
      </div>

      <div v-if="!isPast" class="flex gap-2">
        <button
          @click="$emit('edit', block)"
          class="btn-secondary text-sm flex-1"
        >
          ✎ Edit
        </button>
        <button
          @click="$emit('delete', block)"
          class="btn-danger text-sm flex-1"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isSameDay } from 'date-fns'
import type { UnavailableBlock } from '@/types'

const props = defineProps<{
  block: UnavailableBlock
  editable?: boolean
}>()

defineEmits<{
  edit: [block: UnavailableBlock]
  delete: [block: UnavailableBlock]
}>()

const isPast = computed(() => {
  const endDate = new Date(props.block.endDate)
  return endDate < new Date()
})

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isSameDay(start, end)) {
    return format(start, 'EEEE, MMMM do, yyyy')
  }

  return `${format(start, 'MMM do')} – ${format(end, 'MMM do, yyyy')}`
}
</script>
