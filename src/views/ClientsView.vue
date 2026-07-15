<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1>Clients</h1>
        <p class="text-gray-600 mt-2">Manage your massage therapy clients</p>
      </div>
      <button @click="showForm = true" class="btn-primary">
        + New Client
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        type="text"
        placeholder="Search by name, email, or phone..."
        class="input-field"
        @input="(e) => clientsStore.setSearchQuery((e.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="clientsStore.loading" class="card p-8 text-center">
      <p class="text-gray-500">Loading clients...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="clientsStore.error" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">{{ clientsStore.error }}</p>
    </div>

    <!-- Clients Table -->
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
              <th class="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="client in clientsStore.filteredClients" :key="client.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <button
                  @click="showClientDetail(client)"
                  class="font-medium text-sage-600 hover:text-sage-700 cursor-pointer"
                >
                  {{ client.firstName }} {{ client.lastName }}
                </button>
              </td>
              <td class="px-6 py-4 text-gray-600">{{ client.email || '-' }}</td>
              <td class="px-6 py-4 text-gray-600">{{ client.phone || '-' }}</td>
              <td class="px-6 py-4 text-gray-600">{{ formatDate(client.createdAt) }}</td>
              <td class="px-6 py-4 text-right space-x-3">
                <button
                  @click="selectClient(client)"
                  class="text-sage-600 hover:text-sage-700 text-sm font-medium"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="clientsStore.filteredClients.length === 0" class="px-6 py-12 text-center">
        <p class="text-gray-500">
          {{ clientsStore.clients.length === 0 ? 'No clients yet. Create one to get started!' : 'No clients match your search' }}
        </p>
      </div>
    </div>

    <!-- Client Form Modal -->
    <ClientForm
      v-if="showForm"
      :client="selectedClient"
      @close="closeForm"
      @saved="handleClientSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { formatDistanceToNow } from 'date-fns'
import type { Client } from '@/types'
import ClientForm from '@/components/ClientForm.vue'

const router = useRouter()
const clientsStore = useClientsStore()
const showForm = ref(false)
const selectedClient = ref<Client | undefined>()

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function selectClient(client: Client) {
  selectedClient.value = client
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  selectedClient.value = undefined
}

function handleClientSaved(client: Client) {
  closeForm()
  // Optionally navigate to detail view
  // router.push(`/clients/${client.id}`)
}

function showClientDetail(client: Client) {
  router.push(`/clients/${client.id}`)
}

onMounted(() => {
  clientsStore.fetchClients()
})
</script>
