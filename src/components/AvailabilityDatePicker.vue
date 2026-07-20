<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { apiService } from '@/services/api'

const props = withDefaults(
  defineProps<{
    /** YYYY-MM-DD */
    modelValue?: string | null
    /** Session length in minutes — availability depends on it */
    duration?: number | null
    /** Ignore this booking's own slot when checking availability (edit screens) */
    excludeBookingId?: string | null
    /** Earliest selectable date (omit to allow past dates, e.g. fixing records) */
    minDate?: Date | null
  }>(),
  { modelValue: '', duration: null, excludeBookingId: null, minDate: null }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const unavailable = ref<Set<string>>(new Set())

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

async function loadUnavailable() {
  if (!props.duration) {
    unavailable.value = new Set()
    return
  }
  const start = new Date()
  const end = new Date(start.getTime() + 180 * 24 * 60 * 60 * 1000)
  try {
    const res = await apiService.getUnavailableDates(
      toYmd(start),
      toYmd(end),
      props.duration,
      props.excludeBookingId || undefined
    )
    unavailable.value = new Set(res.dates || [])
  } catch {
    // Degrade gracefully — the slot picker / conflict check still guard booking.
    unavailable.value = new Set()
  }
}

watch(() => [props.duration, props.excludeBookingId], loadUnavailable, { immediate: true })

const value = computed({
  get: () => props.modelValue || null,
  set: (v: string | null) => emit('update:modelValue', v || ''),
})

// Rebuilt when the set changes so the picker re-evaluates its days.
const disabledDates = computed(() => {
  const set = unavailable.value
  return (date: Date) => set.has(toYmd(date))
})
const datePickerUi = computed(() => {
  const set = unavailable.value
  return { dayClass: (date: Date) => (set.has(toYmd(date)) ? 'day-unavailable' : '') }
})
</script>

<template>
  <div class="availability-picker">
    <VueDatePicker
      v-model="value"
      model-type="yyyy-MM-dd"
      :formats="{ input: 'dd/MM/yyyy' }"
      :time-config="{ enableTimePicker: false }"
      :disabled-dates="disabledDates"
      :ui="datePickerUi"
      :min-date="minDate || undefined"
      prevent-min-max-navigation
      auto-apply
      teleport
      placeholder="Select a date"
    />
  </div>
</template>

<style scoped>
.availability-picker :deep(.dp--main) {
  width: 100%;
  --dp-primary-color: #6b7f5e;
}

.availability-picker :deep(.dp--input) {
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-left: 2.5rem; /* room for the calendar icon */
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  background: #fff;
}

.availability-picker :deep(.dp--input:focus) {
  outline: none;
  border-color: #6b7f5e;
  box-shadow: 0 0 0 3px rgba(107, 127, 94, 0.15);
}

/* Days with no availability: red diagonal slash */
:deep(.day-unavailable) {
  position: relative;
  opacity: 0.75;
}

:deep(.day-unavailable)::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  top: 50%;
  height: 2px;
  background: #dc2626;
  transform: rotate(-45deg);
  transform-origin: center;
  pointer-events: none;
}
</style>
