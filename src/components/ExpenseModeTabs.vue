<template>
  <div class="flex border-b border-gray-200">
    <button
      type="button"
      :class="tabClass('single')"
      @click="select('single')"
    >
      <i class="fas fa-receipt mr-1"></i>Single
    </button>
    <button
      type="button"
      :class="tabClass('recurring')"
      @click="select('recurring')"
    >
      <i class="fas fa-repeat mr-1"></i>Recurring
    </button>
  </div>
</template>

<script setup lang="ts">
export type ExpenseMode = 'single' | 'recurring'

const props = defineProps<{ active: ExpenseMode }>()
const emit = defineEmits<{ select: [ExpenseMode] }>()

function select(mode: ExpenseMode) {
  if (mode !== props.active) emit('select', mode)
}

function tabClass(tab: ExpenseMode) {
  const base = 'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors'
  return tab === props.active
    ? `${base} border-sage-500 text-sage-700`
    : `${base} border-transparent text-gray-500 hover:text-gray-700`
}
</script>
