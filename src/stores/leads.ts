import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Lead } from '@/types'

export const useLeadsStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const currentLead = ref<Lead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => leads.value.filter((l) => !l.isRead).length)

  async function fetchLeads() {
    loading.value = true
    error.value = null
    try {
      leads.value = await apiService.getLeads()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch leads'
    } finally {
      loading.value = false
    }
  }

  async function fetchLead(id: string) {
    loading.value = true
    error.value = null
    try {
      currentLead.value = await apiService.getLead(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch lead'
    } finally {
      loading.value = false
    }
  }

  async function setRead(id: string, isRead: boolean) {
    try {
      const updated = await apiService.updateLead(id, { isRead })
      const index = leads.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leads.value[index] = updated
      }
      if (currentLead.value?.id === id) {
        currentLead.value = { ...currentLead.value, ...updated }
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update lead'
      throw err
    }
  }

  async function replyToLead(id: string, reply: { subject: string; body: string }) {
    try {
      const newReply = await apiService.replyToLead(id, reply)
      if (currentLead.value?.id === id) {
        currentLead.value = {
          ...currentLead.value,
          isRead: true,
          replies: [...(currentLead.value.replies || []), newReply],
        }
      }
      const index = leads.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leads.value[index] = { ...leads.value[index], isRead: true }
      }
      return newReply
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send reply'
      throw err
    }
  }

  async function fetchLeadsForClient(clientId: string): Promise<Lead[]> {
    try {
      return await apiService.getLeads(clientId)
    } catch (err) {
      return []
    }
  }

  return {
    leads,
    currentLead,
    loading,
    error,
    unreadCount,
    fetchLeads,
    fetchLead,
    setRead,
    replyToLead,
    fetchLeadsForClient,
  }
})
