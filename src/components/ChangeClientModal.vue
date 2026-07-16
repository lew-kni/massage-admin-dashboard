<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col">
      <div class="card-header flex justify-between items-center shrink-0">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <div class="card-body flex flex-col gap-3 overflow-hidden">
        <input
          v-model="search"
          type="text"
          class="input-field shrink-0"
          placeholder="Search by name, email, or phone..."
          autofocus
        />

        <div v-if="error" class="p-2 bg-red-50 border border-red-200 rounded shrink-0">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="overflow-y-auto -mx-2 px-2">
          <p v-if="clientsStore.loading && clientsStore.clients.length === 0" class="text-sm text-gray-500 text-center py-6">
            Loading clients...
          </p>
          <p v-else-if="filtered.length === 0" class="text-sm text-gray-400 text-center py-6">
            No clients match your search.
          </p>
          <button
            v-for="client in filtered"
            :key="client.id"
            @click="choose(client.id)"
            :disabled="saving"
            class="w-full text-left px-3 py-2 rounded border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            :class="{ 'bg-sage-50 dark:bg-gray-800': client.id === currentClientId }"
          >
            <div class="flex justify-between items-center gap-2">
              <div class="min-w-0">
                <p class="font-medium truncate">{{ client.firstName }} {{ client.lastName }}</p>
                <p class="text-sm text-gray-500 truncate">{{ client.email || client.phone || 'No contact details' }}</p>
              </div>
              <span v-if="client.id === currentClientId" class="badge badge-success text-xs shrink-0">Current</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClientsStore } from '@/stores/clients'

const props = withDefaults(
  defineProps<{
    currentClientId?: string | null
    title?: string
  }>(),
  { currentClientId: null, title: 'Change Client' }
)

const emit = defineEmits<{ close: []; select: [clientId: string] }>()

const clientsStore = useClientsStore()
const search = ref('')
const saving = ref(false)
const error = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return clientsStore.clients
  return clientsStore.clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
  )
})

function choose(clientId: string) {
  if (clientId === props.currentClientId) {
    emit('close')
    return
  }
  emit('select', clientId)
}

onMounted(() => {
  if (clientsStore.clients.length === 0) {
    clientsStore.fetchClients()
  }
})
</script>
