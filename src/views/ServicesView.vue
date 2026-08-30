<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Services</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Manage what you offer, session lengths, and pricing</p>
      </div>
      <button @click="newService" class="btn-primary text-sm shrink-0">
        <i class="fas fa-plus"></i>
        <span>New Service</span>
      </button>
    </div>

    <div class="space-y-4">
      <div v-if="store.loading && store.services.length === 0" class="text-center py-12 text-gray-500">
        Loading services...
      </div>

      <div v-else-if="store.services.length === 0" class="card p-12 text-center text-gray-500">
        No services yet. Create your first one.
      </div>

      <div
        v-for="service in paginatedServices"
        :key="service.id"
        class="card"
        :class="{ 'opacity-60': !service.isActive }"
      >
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold">{{ service.name }}</h3>
                <span class="badge" :class="service.category === 'sports' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                  {{ service.category }}
                </span>
                <span v-if="!service.isActive" class="badge badge-danger">Inactive</span>
                <span v-if="!service.bookable" class="badge badge-warning">Not bookable</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">/{{ service.slug }}</p>
              <p class="text-sm text-gray-700 mt-2">{{ service.summary }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button @click="editService(service)" class="btn-secondary text-sm">
                <i class="fas fa-edit"></i>
                <span>Edit</span>
              </button>
              <button @click="confirmDeleteService(service)" class="btn-danger text-sm">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="d in service.durations"
              :key="d.id"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm"
              :class="{ 'opacity-50': d.isActive === false }"
            >
              <span class="font-medium">{{ d.minutes }} min</span>
              <span class="text-gray-500">·</span>
              <span>{{ d.price === null || d.price === undefined ? 'TBC' : formatGBP(d.price) }}</span>
              <i v-if="d.promotionId" class="fas fa-tag text-amber-600 text-xs" title="Has a promotion pinned to this duration"></i>
            </span>
            <span v-if="service.durations.length === 0" class="text-sm text-gray-400">No durations set</span>
          </div>
        </div>
      </div>

      <Pagination v-model="servicesPage" :total-pages="servicesTotalPages" />
    </div>

    <!-- Modals -->
    <ServiceFormModal
      v-if="showServiceModal"
      :service="editingService || undefined"
      @close="showServiceModal = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useServicesStore } from '@/stores/services'
import type { Service } from '@/types'
import { formatGBP } from '@/utils/money'
import ServiceFormModal from '@/components/ServiceFormModal.vue'
import Pagination from '@/components/Pagination.vue'

const store = useServicesStore()

const showServiceModal = ref(false)
const editingService = ref<Service | null>(null)

const PAGE_SIZE = 10
const servicesPage = ref(1)
const servicesTotalPages = computed(() => Math.max(1, Math.ceil(store.services.length / PAGE_SIZE)))
const paginatedServices = computed(() =>
  store.services.slice((servicesPage.value - 1) * PAGE_SIZE, servicesPage.value * PAGE_SIZE)
)

function newService() {
  editingService.value = null
  showServiceModal.value = true
}

function editService(service: Service) {
  editingService.value = service
  showServiceModal.value = true
}

async function confirmDeleteService(service: Service) {
  if (confirm(`Delete "${service.name}"? This removes it and its durations, and can't be undone.`)) {
    await store.deleteService(service.id)
  }
}

function onSaved() {
  // Stores refetch internally; nothing else needed here
}

onMounted(() => {
  store.fetchServices()
  // Promotions still power the "pinned promotion" tag on durations, and the
  // ServiceFormModal's per-duration promotion picker.
  store.fetchPromotions()
})
</script>
