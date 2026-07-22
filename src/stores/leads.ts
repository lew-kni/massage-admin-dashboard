import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Lead } from '@/types'

export const useLeadsStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const deletedLeads = ref<Lead[]>([])
  const currentLead = ref<Lead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Spam doesn't count towards the inbox unread badge — it has its own tab.
  const unreadCount = computed(() => leads.value.filter((l) => !l.isRead && !l.isSpam).length)

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

  async function fetchDeletedLeads() {
    loading.value = true
    error.value = null
    try {
      deletedLeads.value = await apiService.getDeletedLeads()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch trash'
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

  async function linkClient(id: string, clientId: string) {
    try {
      const updated = await apiService.updateLead(id, { clientId })
      const index = leads.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        leads.value[index] = updated
      }
      if (currentLead.value?.id === id) {
        currentLead.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to link client'
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

  async function setSpam(id: string, isSpam: boolean) {
    try {
      const updated = await apiService.updateLead(id, { isSpam })
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

  // Soft delete — moves the lead from the active list into Trash.
  async function softDelete(id: string) {
    try {
      await apiService.deleteLead(id)
      leads.value = leads.value.filter((l) => l.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete lead'
      throw err
    }
  }

  // Restore from Trash back to the active list.
  async function restore(id: string) {
    try {
      const restored = await apiService.restoreLead(id)
      deletedLeads.value = deletedLeads.value.filter((l) => l.id !== id)
      leads.value = [restored, ...leads.value]
      return restored
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restore lead'
      throw err
    }
  }

  // Permanent delete — only valid for a lead already in Trash.
  async function permanentlyDelete(id: string) {
    try {
      await apiService.permanentlyDeleteLead(id)
      deletedLeads.value = deletedLeads.value.filter((l) => l.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to permanently delete lead'
      throw err
    }
  }

  return {
    leads,
    deletedLeads,
    currentLead,
    loading,
    error,
    unreadCount,
    fetchLeads,
    fetchDeletedLeads,
    fetchLead,
    setRead,
    setSpam,
    replyToLead,
    linkClient,
    fetchLeadsForClient,
    softDelete,
    restore,
    permanentlyDelete,
  }
})
