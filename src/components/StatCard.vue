<template>
  <div class="card p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-gray-600 text-sm font-medium">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ value }}</p>
      </div>
      <div class="bg-sage-100 rounded-lg p-3 text-sage-600 text-2xl">
        {{ displayIcon }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
}>()

const iconMap: Record<string, string> = {
  Users: '👥',
  Calendar: '📅',
  TrendingUp: '📈',
  AlertCircle: '⚠️',
}

const displayIcon = computed(() => iconMap[props.icon] || '📊')
</script>
