<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-600 dark:text-gray-400 mt-2">{{ subtitle }}</p>
    </div>

    <div class="card p-12 text-center">
      <i class="fas fa-screwdriver-wrench text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
      <p class="text-lg font-medium text-gray-500 dark:text-gray-400">Feature coming soon</p>
      <p class="text-sm text-gray-400 mt-1">This section isn't available yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>
