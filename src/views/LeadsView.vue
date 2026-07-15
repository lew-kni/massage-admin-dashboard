<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">Leads</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Enquiries submitted through the contact form</p>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-6">
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
        All ({{ leadsStore.leads.length }})
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="leadsStore.loading && leadsStore.leads.length === 0" class="card p-8 text-center">
      <p class="text-gray-500">Loading leads...</p>
    </div>
    <div v-else-if="leadsStore.error" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">{{ leadsStore.error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayLeads.length === 0" class="card p-8 text-center text-gray-500">
      {{ filter ? `No ${filter} leads` : 'No leads yet' }}
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <RouterLink
        v-for="lead in paginatedLeads"
        :key="lead.id"
        :to="`/leads/${lead.id}`"
        class="card block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        :class="!lead.isRead ? 'border-l-4 border-sage-500' : 'border-l-4 border-transparent'"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span v-if="!lead.isRead" class="w-2 h-2 rounded-full bg-sage-500 shrink-0"></span>
              <p :class="['truncate', !lead.isRead ? 'font-semibold' : 'font-medium']">{{ lead.name }}</p>
              <span v-if="lead.service" class="badge badge-success text-xs shrink-0">{{ formatService(lead.service) }}</span>
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
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click.stop.prevent="leadsStore.setRead(lead.id, !lead.isRead)"
              class="btn-secondary text-xs"
              :title="lead.isRead ? 'Mark as unread' : 'Mark as read'"
            >
              <i :class="lead.isRead ? 'fas fa-envelope' : 'fas fa-envelope-open'"></i>
            </button>
            <i class="fas fa-chevron-right text-gray-300"></i>
          </div>
        </div>
      </RouterLink>

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

const leadsStore = useLeadsStore()
const filter = ref<'unread' | 'read' | null>(null)

const PAGE_SIZE = 10
const currentPage = ref(1)

const unreadCount = computed(() => leadsStore.leads.filter((l) => !l.isRead).length)
const readCount = computed(() => leadsStore.leads.filter((l) => l.isRead).length)

const displayLeads = computed(() => {
  if (filter.value === 'unread') return leadsStore.leads.filter((l) => !l.isRead)
  if (filter.value === 'read') return leadsStore.leads.filter((l) => l.isRead)
  return leadsStore.leads
})

const totalPages = computed(() => Math.max(1, Math.ceil(displayLeads.value.length / PAGE_SIZE)))
const paginatedLeads = computed(() =>
  displayLeads.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

watch(filter, () => {
  currentPage.value = 1
})

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
})
</script>
