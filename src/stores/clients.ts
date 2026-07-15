import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Client } from '@/types'

export const useClientsStore = defineStore('clients', () => {
  const clients = ref<Client[]>([])
  const currentClient = ref<Client | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const searchQuery = ref('')

  const filteredClients = computed(() => {
    if (!searchQuery.value) return clients.value

    const query = searchQuery.value.toLowerCase()
    return clients.value.filter(
      (client) =>
        client.firstName.toLowerCase().includes(query) ||
        client.lastName.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query)
    )
  })

  async function fetchClients() {
    loading.value = true
    error.value = null
    try {
      clients.value = await apiService.getClients()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch clients'
    } finally {
      loading.value = false
    }
  }

  async function fetchClient(id: string) {
    loading.value = true
    error.value = null
    try {
      currentClient.value = await apiService.getClient(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch client'
    } finally {
      loading.value = false
    }
  }

  async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const newClient = await apiService.createClient(client)
      clients.value.push(newClient)
      return newClient
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create client'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateClient(id: string, client: Partial<Client>) {
    loading.value = true
    error.value = null
    try {
      const updated = await apiService.updateClient(id, client)
      const index = clients.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        clients.value[index] = updated
      }
      if (currentClient.value?.id === id) {
        currentClient.value = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update client'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteClient(id: string) {
    loading.value = true
    error.value = null
    try {
      await apiService.deleteClient(id)
      clients.value = clients.value.filter((c) => c.id !== id)
      if (currentClient.value?.id === id) {
        currentClient.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete client'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  return {
    clients,
    currentClient,
    loading,
    error,
    filteredClients,
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    deleteClient,
    setSearchQuery,
  }
})
