<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">Appearance</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Branding</p>
    </div>

    <div class="card max-w-3xl">
      <div class="card-header">
        <h2 class="text-lg font-semibold"><i class="fas fa-adjust mr-2"></i>Theme</h2>
      </div>
      <div class="card-body">
        <label class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">Dark mode</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Enable dark theme for the admin interface</div>
          </div>
          <input type="checkbox" class="w-5 h-5" v-model="isDark" />
        </label>
        <p class="text-xs text-gray-400 mt-3">More branding options coming soon.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed<boolean>({
  get: () => themeStore.theme === 'dark',
  set: (v: boolean) => themeStore.setTheme(v ? 'dark' : 'light'),
})
</script>
