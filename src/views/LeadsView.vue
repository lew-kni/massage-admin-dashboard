<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">Leads</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Enquiries submitted through the contact form</p>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        @click="filter = 'unread'"
        :class="['btn-secondary text-sm', filter === 'unread' && 'ring-2 ring-sage-500']"
      >
        Unread ({{ unreadCount }})
      </button>
      <button
        @click="filter = 'read'"
        :class="['btn-secondary text-sm', filter === 'read' && 'ring-2 ring-sage-500']"
      >
        Read ({{ readCount }})
      </button>
      <button
        @click="filter = null"
        :class="['btn-secondary text-sm', filter === null && 'ring-2 ring-sage-500']"
      >
        All ({{ activeLeads.length }})
      </button>
      <button
        @click="filter = 'spam'"
        :class="['btn-secondary text-sm', filter === 'spam' && 'ring-2 ring-sage-500']"
      >
        <i class="fas fa-triangle-exclamation mr-1"></i>Spam ({{ spamLeads.length }})
      </button>
      <button
        @click="selectTrash"
        :class="['btn-secondary text-sm', filter === 'trash' && 'ring-2 ring-sage-500']"
      >
        <i class="fas fa-trash-alt mr-1"></i>Trash ({{ leadsStore.deletedLeads.length }})
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="leadsStore.loading && displayLeads.length === 0" class="card p-8 text-center">
      <p class="text-gray-500">Loading leads...</p>
    </div>
    <div v-else-if="leadsStore.error" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">{{ leadsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayLeads.length === 0" class="card p-8 text-center text-gray-500">
      {{ filter === 'trash' ? 'Trash is empty' : filter === 'spam' ? 'No spam' : filter ? `No ${filter} leads` : 'No leads yet' }}
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="lead in paginatedLeads"
        :key="lead.id"
        class="card p-4"
        :class="!lead.isRead ? 'border-l-4 border-sage-500' : 'border-l-4 border-transparent'"
      >
        <div class="flex justify-between items-start gap-4">
          <RouterLink :to="`/leads/${lead.id}`" class="min-w-0 flex-1 hover:opacity-80">
            <div class="flex items-center gap-2">
              <span v-if="!lead.isRead" class="w-2 h-2 rounded-full bg-sage-500 shrink-0"></span>
              <p :class="['truncate', !lead.isRead ? 'font-semibold' : 'font-medium']">{{ lead.name }}</p>
              <span v-if="lead.service" class="badge badge-success text-xs shrink-0">{{ formatService(lead.service) }}</span>
              <span v-if="lead.isSpam" class="badge badge-danger text-xs shrink-0">Spam</span>
            </div>
            <p class="text-sm text-gray-500 mt-1 truncate">{{ lead.message }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-400 mt-2">
              <span>{{ formatRelative(lead.createdAt) }}</span>
              <span v-if="lead.location"><i class="fas fa-location-dot mr-1"></i>{{ lead.location }}</span>
              <span v-if="lead.clientId" class="text-sage-600">
                <i class="fas fa-user mr-1"></i>Existing client
              </span>
              <span v-if="lead.replies && lead.replies.length > 0" class="text-sage-600">
                <i class="fas fa-reply mr-1"></i>Replied
              </span>
            </div>
          </RouterLink>
          <div class="flex items-center gap-2 shrink-0">
            <template v-if="filter === 'trash'">
              <button @click="leadsStore.restore(lead.id)" class="btn-secondary text-xs" title="Restore">
                <i class="fas fa-trash-restore"></i>
              </button>
              <button @click="confirmPermanentDelete(lead)" class="btn-danger text-xs" title="Delete forever">
                <i class="fas fa-trash-alt"></i>
              </button>
            </template>
            <template v-else>
              <button
                v-if="filter !== 'spam'"
                @click="leadsStore.setRead(lead.id, !lead.isRead)"
                class="btn-secondary text-xs"
                :title="lead.isRead ? 'Mark as unread' : 'Mark as read'"
              >
                <i :class="lead.isRead ? 'fas fa-envelope' : 'fas fa-envelope-open'"></i>
              </button>
              <button
                @click="leadsStore.setSpam(lead.id, !lead.isSpam)"
                class="btn-secondary text-xs"
                :title="lead.isSpam ? 'Not spam' : 'Mark as spam'"
              >
                <i class="fas fa-triangle-exclamation"></i>
              </button>
              <button @click="leadsStore.softDelete(lead.id)" class="btn-danger text-xs" title="Delete">
                <i class="fas fa-trash-alt"></i>
              </button>
            </template>
          </div>
        </div>
      </div>

      <Pagination v-model="currentPage" :total-pages="totalPages" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useLeadsStore } from '@/stores/leads'
import { formatDistanceToNow } from 'date-fns'
import Pagination from '@/components/Pagination.vue'
import type { Lead } from '@/types'

const leadsStore = useLeadsStore()
const filter = ref<'unread' | 'read' | 'spam' | 'trash' | null>(null)

const PAGE_SIZE = 10
const currentPage = ref(1)

// Spam has its own tab — excluded from the normal Unread/Read/All inbox views.
const activeLeads = computed(() => leadsStore.leads.filter((l) => !l.isSpam))
const spamLeads = computed(() => leadsStore.leads.filter((l) => l.isSpam))

const unreadCount = computed(() => activeLeads.value.filter((l) => !l.isRead).length)
const readCount = computed(() => activeLeads.value.filter((l) => l.isRead).length)

const displayLeads = computed(() => {
  if (filter.value === 'unread') return activeLeads.value.filter((l) => !l.isRead)
  if (filter.value === 'read') return activeLeads.value.filter((l) => l.isRead)
  if (filter.value === 'spam') return spamLeads.value
  if (filter.value === 'trash') return leadsStore.deletedLeads
  return activeLeads.value
})

const totalPages = computed(() => Math.max(1, Math.ceil(displayLeads.value.length / PAGE_SIZE)))
const paginatedLeads = computed(() =>
  displayLeads.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

watch(filter, () => {
  currentPage.value = 1
})

function selectTrash() {
  filter.value = 'trash'
  if (leadsStore.deletedLeads.length === 0) leadsStore.fetchDeletedLeads()
}

function confirmPermanentDelete(lead: Lead) {
  if (confirm(`Permanently delete the lead from "${lead.name}"? This can't be undone.`)) {
    leadsStore.permanentlyDelete(lead.id)
  }
}

function formatService(service: string) {
  if (service === 'relaxation-massage') return 'Relaxation Massage'
  if (service === 'sports-massage') return 'Sports Massage'
  if (service === 'not-sure') return 'Not sure yet'
  return service
}

function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

onMounted(() => {
  leadsStore.fetchLeads()
  leadsStore.fetchDeletedLeads()
})
</script>
