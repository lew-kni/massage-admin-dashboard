<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1>Send</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Compose a marketing email and send it to everyone who's subscribed. Branding and a
        one-click unsubscribe link are added automatically.
      </p>
    </div>

    <MarketingComposer />
  </div>
</template>

<script setup lang="ts">
import MarketingComposer from '@/components/MarketingComposer.vue'
</script>
