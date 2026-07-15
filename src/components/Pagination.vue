<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-4">
    <button
      @click="$emit('update:modelValue', Math.max(1, modelValue - 1))"
      :disabled="modelValue === 1"
      class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <i class="fas fa-chevron-left mr-1"></i>Previous
    </button>
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Page {{ modelValue }} of {{ totalPages }}
    </div>
    <button
      @click="$emit('update:modelValue', Math.min(totalPages, modelValue + 1))"
      :disabled="modelValue === totalPages"
      class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next<i class="fas fa-chevron-right ml-1"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number
  totalPages: number
}>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
