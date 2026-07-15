<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Emails</h1>
      <p class="text-gray-600 mt-2">Manage email templates and communications</p>
    </div>

    <!-- Email Settings Alert -->
    <div class="card mb-8 p-4 bg-blue-50 border-blue-200">
      <p class="text-sm text-blue-700">
        <strong><i class="fas fa-envelope mr-1"></i>Note:</strong> Email sending is currently disabled for local development.
        Set <code class="bg-white px-2 py-1 rounded">EMAILS_ENABLED=true</code> in your environment to enable sending.
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b">
      <button
        @click="activeTab = 'templates'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'templates' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
<i class="fas fa-envelope-open-text mr-2"></i>Email Templates
      </button>
      <button
        @click="activeTab = 'history'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'history' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        <i class="fas fa-clock-rotate-left mr-2"></i>Send History
      </button>
    </div>

    <!-- Email Templates Tab -->
    <div v-if="activeTab === 'templates'" class="space-y-4">
      <div class="card p-8 text-center text-gray-500">
        <p>Email templates coming soon</p>
      </div>
    </div>

    <!-- Send History Tab -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <div class="card p-8 text-center text-gray-500">
        <p>Email history coming soon</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref<'templates' | 'history'>('templates')
</script>
