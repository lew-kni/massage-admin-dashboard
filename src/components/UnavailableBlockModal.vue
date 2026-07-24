<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ block ? 'Edit Unavailable Block' : 'Add Unavailable Block' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- Block Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
          <div class="flex gap-2">
            <button
              type="button"
              @click="blockType = 'full-day'"
              :class="['flex-1 py-2 px-3 rounded border text-sm font-medium', blockType === 'full-day' ? 'border-sage-500 bg-sage-50 text-sage-700' : 'border-gray-300']"
            >
<i class="fas fa-calendar-days mr-1"></i>Full Day(s)
            </button>
            <button
              type="button"
              @click="blockType = 'partial'"
              :class="['flex-1 py-2 px-3 rounded border text-sm font-medium', blockType === 'partial' ? 'border-sage-500 bg-sage-50 text-sage-700' : 'border-gray-300']"
            >
              <i class="fas fa-clock mr-1"></i>Partial Day
            </button>
          </div>
        </div>

        <!-- Start Date -->
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="startDate"
            v-model="form.startDate"
            type="date"
            class="input-field"
            required
          />
        </div>

        <!-- End Date -->
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="endDate"
            v-model="form.endDate"
            type="date"
            class="input-field"
            required
            :min="form.startDate"
          />
        </div>

        <!-- Time Fields (for partial day) -->
        <div v-if="blockType === 'partial'" class="space-y-3 pt-2 border-t">
          <div>
            <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="startTime"
              v-model="form.startTime"
              type="time"
              class="input-field"
            />
          </div>
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="endTime"
              v-model="form.endTime"
              type="time"
              class="input-field"
            />
          </div>
        </div>

        <!-- Reason -->
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <input
            id="reason"
            v-model="form.reason"
            type="text"
            placeholder="e.g., Holiday, Sick leave, Conference"
            class="input-field"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
          >
            <span v-if="loading">Saving...</span>
            <template v-else-if="block"><i class="fas fa-check"></i><span>Update</span></template>
            <template v-else><i class="fas fa-plus"></i><span>Add Block</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAvailabilityStore } from '@/stores/availability'
import { format } from 'date-fns'
import { toLondonFakeLocalDate, londonWallTimeToUtc, addLondonDays } from '@/utils/formatLondon'
import type { UnavailableBlock } from '@/types'

const emit = defineEmits<{
  close: []
  saved: [block: UnavailableBlock]
}>()

const props = defineProps<{
  block?: UnavailableBlock
}>()

const availabilityStore = useAvailabilityStore()
const loading = ref(false)
const error = ref('')
const blockType = ref<'full-day' | 'partial'>(props.block?.startTime ? 'partial' : 'full-day')

const today = format(new Date(), 'yyyy-MM-dd')

const form = reactive({
  startDate: props.block ? format(toLondonFakeLocalDate(props.block.startDate), 'yyyy-MM-dd') : today,
  endDate: props.block ? format(toLondonFakeLocalDate(props.block.endDate), 'yyyy-MM-dd') : today,
  startTime: props.block?.startTime || '09:00',
  endTime: props.block?.endTime || '17:00',
  reason: props.block?.reason || '',
})

async function submitForm() {
  if (!form.startDate || !form.endDate) {
    error.value = 'Please select start and end dates'
    return
  }

  if (new Date(form.endDate) < new Date(form.startDate)) {
    error.value = 'End date must be after start date'
    return
  }

  if (blockType.value === 'partial' && form.startTime >= form.endTime) {
    error.value = 'Start time must be before end time'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Build proper UTC ISO datetime strings from the London wall-clock values
    // entered above -- sending a naive (no-offset) string here would leave the
    // backend to parse it in whatever timezone its own process happens to run
    // in (Render runs in UTC), silently storing the wrong instant.
    let startDateTime: string
    let endDateTime: string

    if (blockType.value === 'full-day') {
      // For full days, use midnight to end of day
      startDateTime = londonWallTimeToUtc(form.startDate, '00:00').toISOString()
      // End date should be at the end of the day
      endDateTime = londonWallTimeToUtc(addLondonDays(form.endDate, 1), '00:00').toISOString()
    } else {
      // For partial days, combine date and time
      startDateTime = londonWallTimeToUtc(form.startDate, form.startTime).toISOString()
      endDateTime = londonWallTimeToUtc(form.endDate, form.endTime).toISOString()
    }

    // Call the API directly through the availability store
    const blocked = await availabilityStore.createUnavailableBlock({
      startDate: startDateTime,
      endDate: endDateTime,
      startTime: blockType.value === 'partial' ? form.startTime : null,
      endTime: blockType.value === 'partial' ? form.endTime : null,
      reason: form.reason || null,
    })

    emit('saved', blocked)
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save unavailable block'
  } finally {
    loading.value = false
  }
}
</script>
