<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="card p-6"
    :class="{ 'hover:shadow-md hover:border-sage-300 transition-shadow cursor-pointer': to }"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-gray-600 text-sm font-medium">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ value }}</p>
      </div>
      <div class="bg-sage-100 rounded-lg p-3 text-sage-600 text-2xl">
        <i :class="displayIcon"></i>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  to?: string
}>()

const iconMap: Record<string, string> = {
  Users: 'fas fa-users',
  Calendar: 'fas fa-calendar-days',
  TrendingUp: 'fas fa-chart-line',
  AlertCircle: 'fas fa-triangle-exclamation',
}

const displayIcon = computed(() => iconMap[props.icon] || 'fas fa-chart-simple')
</script>
