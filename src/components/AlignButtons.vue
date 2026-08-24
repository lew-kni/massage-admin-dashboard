<template>
  <div class="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
    <button
      v-for="o in opts"
      :key="o.v"
      type="button"
      @click="model = o.v"
      class="px-2.5 py-1 text-sm transition-colors"
      :class="model === o.v ? 'bg-sage-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
      :aria-label="o.v"
    >
      <i class="fas" :class="o.icon"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Align } from '@/utils/marketingBlocks'

const model = defineModel<Align>({ required: true })

const opts: { v: Align; icon: string }[] = [
  { v: 'left', icon: 'fa-align-left' },
  { v: 'center', icon: 'fa-align-center' },
  { v: 'right', icon: 'fa-align-right' },
]
</script>
