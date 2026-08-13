import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Vendor, VendorDetail } from '@/types'

export const useVendorsStore = defineStore('vendors', () => {
  const vendors = ref<Vendor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchVendors() {
    loading.value = true
    error.value = null
    try {
      vendors.value = await apiService.getVendors()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch vendors'
    } finally {
      loading.value = false
    }
  }

  async function getVendor(id: string): Promise<VendorDetail> {
    return apiService.getVendor(id)
  }

  async function createVendor(payload: { name: string; notes?: string | null; defaultCategory?: string | null }) {
    const created = await apiService.createVendor(payload)
    await fetchVendors()
    return created
  }

  async function updateVendor(
    id: string,
    payload: Partial<Pick<Vendor, 'name' | 'notes' | 'defaultCategory'>>
  ) {
    const updated = await apiService.updateVendor(id, payload)
    await fetchVendors()
    return updated
  }

  async function deleteVendor(id: string) {
    await apiService.deleteVendor(id)
    vendors.value = vendors.value.filter((v) => v.id !== id)
  }

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    getVendor,
    createVendor,
    updateVendor,
    deleteVendor,
  }
})
