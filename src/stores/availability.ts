import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { UnavailableBlock } from '@/types'

export const useAvailabilityStore = defineStore('availability', () => {
  const unavailableBlocks = ref<UnavailableBlock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUnavailableBlocks() {
    loading.value = true
    error.value = null
    try {
      const blockedTimes = await apiService.getBlockedTimes()
      unavailableBlocks.value = blockedTimes.map((block: any) => ({
        id: block.id,
        startDate: block.startTime,
        endDate: block.endTime,
        startTime: null,
        endTime: null,
        reason: block.reason || null,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt || block.createdAt,
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch unavailable blocks'
    } finally {
      loading.value = false
    }
  }

  async function createUnavailableBlock(block: Omit<UnavailableBlock, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      // Call the API with proper ISO datetime strings
      const response = await apiService.blockTime({
        startTime: block.startDate, // This should be a full ISO datetime string like "2026-11-01T00:00:00"
        endTime: block.endDate, // This should be a full ISO datetime string like "2026-11-21T00:00:00"
        reason: block.reason || undefined,
      })

      // Convert API response to our UnavailableBlock format
      const formattedBlock: UnavailableBlock = {
        id: response.id,
        startDate: response.startTime,
        endDate: response.endTime,
        startTime: block.startTime,
        endTime: block.endTime,
        reason: response.reason,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
      }
      unavailableBlocks.value.push(formattedBlock)
      return formattedBlock
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create unavailable block'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUnavailableBlock(id: string) {
    loading.value = true
    error.value = null
    try {
      await apiService.removeBlockedTime(id)
      unavailableBlocks.value = unavailableBlocks.value.filter(b => b.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete unavailable block'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    unavailableBlocks,
    loading,
    error,
    fetchUnavailableBlocks,
    createUnavailableBlock,
    deleteUnavailableBlock,
  }
})
