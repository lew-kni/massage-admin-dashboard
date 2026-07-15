import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Service, ServiceDuration, Promotion } from '@/types'

export const useServicesStore = defineStore('services', () => {
  const services = ref<Service[]>([])
  const promotions = ref<Promotion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchServices() {
    loading.value = true
    error.value = null
    try {
      services.value = await apiService.getServices()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch services'
    } finally {
      loading.value = false
    }
  }

  async function fetchPromotions() {
    loading.value = true
    error.value = null
    try {
      promotions.value = await apiService.getPromotions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch promotions'
    } finally {
      loading.value = false
    }
  }

  async function createService(payload: Partial<Service> & { durations?: ServiceDuration[] }) {
    const created = await apiService.createService(payload)
    await fetchServices()
    return created
  }

  async function updateService(id: string, payload: Partial<Service>) {
    const updated = await apiService.updateService(id, payload)
    await fetchServices()
    return updated
  }

  async function deleteService(id: string) {
    await apiService.deleteService(id)
    services.value = services.value.filter((s) => s.id !== id)
  }

  async function upsertDuration(serviceId: string, duration: ServiceDuration) {
    return apiService.upsertServiceDuration(serviceId, duration)
  }

  async function deleteDuration(serviceId: string, durationId: string) {
    return apiService.deleteServiceDuration(serviceId, durationId)
  }

  async function createPromotion(payload: Partial<Promotion>) {
    const created = await apiService.createPromotion(payload)
    await fetchPromotions()
    return created
  }

  async function updatePromotion(id: string, payload: Partial<Promotion>) {
    const updated = await apiService.updatePromotion(id, payload)
    await fetchPromotions()
    return updated
  }

  async function deletePromotion(id: string) {
    await apiService.deletePromotion(id)
    promotions.value = promotions.value.filter((p) => p.id !== id)
  }

  return {
    services,
    promotions,
    loading,
    error,
    fetchServices,
    fetchPromotions,
    createService,
    updateService,
    deleteService,
    upsertDuration,
    deleteDuration,
    createPromotion,
    updatePromotion,
    deletePromotion,
  }
})
