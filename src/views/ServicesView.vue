<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Services &amp; Promotions</h1>
      <p class="text-gray-600 mt-2">Manage what you offer, session lengths, pricing, and campaigns</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b">
      <button
        @click="activeTab = 'services'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'services' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        💆 Services
      </button>
      <button
        @click="activeTab = 'promotions'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'promotions' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        🏷️ Promotions
      </button>
    </div>

    <!-- Services Tab -->
    <div v-if="activeTab === 'services'" class="space-y-4">
      <div class="flex justify-end">
        <button @click="newService" class="btn-primary text-sm">+ New Service</button>
      </div>

      <div v-if="store.loading && store.services.length === 0" class="text-center py-12 text-gray-500">
        Loading services...
      </div>

      <div v-else-if="store.services.length === 0" class="card p-12 text-center text-gray-500">
        No services yet. Create your first one.
      </div>

      <div
        v-for="service in store.services"
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
              <button @click="editService(service)" class="btn-secondary text-sm">✎ Edit</button>
              <button @click="confirmDeleteService(service)" class="btn-danger text-sm">🗑️</button>
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
              <span>{{ d.price === null || d.price === undefined ? 'TBC' : '£' + d.price }}</span>
            </span>
            <span v-if="service.durations.length === 0" class="text-sm text-gray-400">No durations set</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Promotions Tab -->
    <div v-if="activeTab === 'promotions'" class="space-y-4">
      <div class="flex justify-end">
        <button @click="newPromotion" class="btn-primary text-sm">+ New Promotion</button>
      </div>

      <div v-if="store.promotions.length === 0" class="card p-12 text-center text-gray-500">
        No promotions yet.
      </div>

      <div v-for="promo in store.promotions" :key="promo.id" class="card" :class="{ 'opacity-60': !promo.active }">
        <div class="card-body flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <span class="badge" :class="promo.active ? 'badge-success' : 'bg-gray-100 text-gray-700'">
                {{ promo.active ? 'Active' : 'Inactive' }}
              </span>
              <span class="badge bg-orange-100 text-orange-800">{{ promo.discountPercentage }}% off</span>
            </div>
            <p class="font-medium mt-2">{{ promo.message }}</p>
            <p class="text-sm text-gray-500 mt-1">
              Applies to:
              <span v-if="promo.applicableTo === 'all'">all services</span>
              <span v-else>{{ (promo.applicableTo as string[]).join(', ') }}</span>
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="editPromotion(promo)" class="btn-secondary text-sm">✎ Edit</button>
            <button @click="confirmDeletePromotion(promo)" class="btn-danger text-sm">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ServiceFormModal
      v-if="showServiceModal"
      :service="editingService || undefined"
      @close="showServiceModal = false"
      @saved="onSaved"
    />
    <PromotionFormModal
      v-if="showPromotionModal"
      :promotion="editingPromotion || undefined"
      @close="showPromotionModal = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServicesStore } from '@/stores/services'
import type { Service, Promotion } from '@/types'
import ServiceFormModal from '@/components/ServiceFormModal.vue'
import PromotionFormModal from '@/components/PromotionFormModal.vue'

const store = useServicesStore()
const activeTab = ref<'services' | 'promotions'>('services')

const showServiceModal = ref(false)
const editingService = ref<Service | null>(null)
const showPromotionModal = ref(false)
const editingPromotion = ref<Promotion | null>(null)

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

function newPromotion() {
  editingPromotion.value = null
  showPromotionModal.value = true
}

function editPromotion(promo: Promotion) {
  editingPromotion.value = promo
  showPromotionModal.value = true
}

async function confirmDeletePromotion(promo: Promotion) {
  if (confirm('Delete this promotion? This cannot be undone.')) {
    await store.deletePromotion(promo.id)
  }
}

function onSaved() {
  // Stores refetch internally; nothing else needed here
}

onMounted(() => {
  store.fetchServices()
  store.fetchPromotions()
})
</script>
