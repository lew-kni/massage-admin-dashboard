<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">Emails</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Templates and sent history</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b dark:border-gray-700">
      <button
        @click="activeTab = 'templates'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'templates' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600 dark:text-gray-400']"
      >
        <i class="fas fa-envelope-open-text mr-2"></i>Email Templates
      </button>
      <button
        @click="activeTab = 'history'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'history' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600 dark:text-gray-400']"
      >
        <i class="fas fa-clock-rotate-left mr-2"></i>Send History
      </button>
    </div>

    <!-- Email Templates Tab -->
    <div v-if="activeTab === 'templates'" class="space-y-3">
      <div v-if="loadingTemplates" class="card p-8 text-center text-gray-500">Loading templates...</div>
      <div v-else-if="templates.length === 0" class="card p-8 text-center text-gray-500">No templates found.</div>
      <div v-else v-for="t in templates" :key="t.id" class="card">
        <div class="card-body">
          <div class="flex justify-between items-start gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold">{{ prettyName(t.name) }}</h3>
                <span class="badge bg-gray-100 text-gray-700 text-xs">{{ t.type }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ t.subject }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">{{ preview(t.body) }}</p>
            </div>
          </div>
          <div v-if="t.variables && t.variables.length" class="mt-3 flex flex-wrap gap-1">
            <span v-for="v in t.variables" :key="v" class="badge bg-sage-100 text-sage-800 text-xs">{{ varTag(v) }}</span>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 px-1">
        Shown here for reference. To create or edit templates, go to
        <RouterLink to="/settings/email-templates" class="text-sage-600 hover:underline">Settings &rsaquo; Email Templates</RouterLink>.
      </p>
    </div>

    <!-- Send History Tab -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <div v-if="loadingHistory" class="card p-8 text-center text-gray-500">Loading history...</div>
      <div v-else-if="communications.length === 0" class="card p-8 text-center text-gray-500">No emails sent yet.</div>
      <div v-else class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Subject</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Recipient</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Sent</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-gray-700">
              <tr v-for="c in paginatedComms" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 font-medium">{{ c.subject }}</td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-400">
                  <RouterLink v-if="c.client" :to="`/clients/${c.clientId}`" class="text-sage-600 hover:underline">
                    {{ c.client.firstName }} {{ c.client.lastName }}
                  </RouterLink>
                  <span v-else>{{ c.toEmail }}</span>
                  <span class="block text-xs text-gray-400">{{ c.toEmail }}</span>
                </td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ formatDateTime(c.sentAt) }}</td>
                <td class="px-6 py-4"><span :class="['badge', statusClass(c.status)]">{{ c.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-4">
          <Pagination v-model="currentPage" :total-pages="totalPages" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import type { EmailTemplate, Communication } from '@/types'
import Pagination from '@/components/Pagination.vue'

const activeTab = ref<'templates' | 'history'>('templates')

const templates = ref<EmailTemplate[]>([])
const communications = ref<Communication[]>([])
const loadingTemplates = ref(false)
const loadingHistory = ref(false)

const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(communications.value.length / PAGE_SIZE)))
const paginatedComms = computed(() =>
  communications.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

function prettyName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function varTag(v: string) {
  return `{{ ${v} }}`
}

function preview(html: string) {
  const text = html.replace(/<\/p>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > 160 ? text.slice(0, 160) + '…' : text
}

function formatDateTime(date: string) {
  return format(new Date(date), 'MMM dd, yyyy • h:mm a')
}

function statusClass(status: string) {
  switch (status) {
    case 'SENT': return 'badge-success'
    case 'DRAFT': return 'badge-warning'
    case 'FAILED': return 'badge-danger'
    default: return 'bg-gray-100 text-gray-700'
  }
}

onMounted(async () => {
  loadingTemplates.value = true
  loadingHistory.value = true
  try {
    templates.value = await apiService.getTemplates()
  } finally {
    loadingTemplates.value = false
  }
  try {
    communications.value = await apiService.getCommunications()
  } finally {
    loadingHistory.value = false
  }
})
</script>
