<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-8">
      <RouterLink to="/clients" class="text-sage-600 hover:text-sage-700">
        ← Back to Clients
      </RouterLink>
      <button v-if="clientsStore.currentClient" @click="editMode = true" class="btn-secondary text-sm">
        ✎ Edit
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="clientsStore.loading" class="text-center py-12">
      <p class="text-gray-500">Loading client details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="clientsStore.error" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">{{ clientsStore.error }}</p>
    </div>

    <!-- Client Details -->
    <div v-else-if="clientsStore.currentClient" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Client Information Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-2xl font-semibold">
              {{ clientsStore.currentClient.firstName }} {{ clientsStore.currentClient.lastName }}
            </h2>
            <p class="text-gray-500 text-sm mt-1">ID: {{ clientsStore.currentClient.id }}</p>
          </div>
          <div class="card-body space-y-6">
            <!-- Contact Information -->
            <div>
              <h3 class="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="font-medium">
                    <a v-if="clientsStore.currentClient.email" :href="`mailto:${clientsStore.currentClient.email}`" class="text-sage-600 hover:underline">
                      {{ clientsStore.currentClient.email }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Phone</p>
                  <p class="font-medium">
                    <a v-if="clientsStore.currentClient.phone" :href="`tel:${clientsStore.currentClient.phone}`" class="text-sage-600 hover:underline">
                      {{ clientsStore.currentClient.phone }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Personal Details -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-3">Personal Details</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Date of Birth</p>
                  <p class="font-medium">
                    <span v-if="clientsStore.currentClient.dateOfBirth">{{ formatDateOnly(clientsStore.currentClient.dateOfBirth) }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Address</p>
                  <p class="font-medium">
                    <span v-if="clientsStore.currentClient.address">{{ clientsStore.currentClient.address }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">City</p>
                  <p class="font-medium">
                    <span v-if="clientsStore.currentClient.city">{{ clientsStore.currentClient.city }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Postcode</p>
                  <p class="font-medium">
                    <span v-if="clientsStore.currentClient.postcode">{{ clientsStore.currentClient.postcode }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Notes Timeline -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-4">📝 Notes</h3>

              <!-- Add New Note -->
              <div class="mb-6 pb-6 border-b">
                <textarea
                  v-model="newNote"
                  placeholder="Add a new note..."
                  class="input-field"
                  rows="3"
                />
                <button
                  v-if="newNote.trim()"
                  @click="addNote"
                  :disabled="addingNote"
                  class="mt-2 btn-primary text-sm"
                >
                  {{ addingNote ? 'Adding...' : '✓ Add Note' }}
                </button>
              </div>

              <!-- Notes List -->
              <div v-if="notesList.length > 0" class="space-y-4">
                <div
                  v-for="(note, index) in notesList"
                  :key="index"
                  class="border-l-4 border-sage-300 pl-4 py-2"
                >
                  <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-medium text-gray-500">
                      {{ formatDateTime(note.createdAt) }}
                    </span>
                    <button
                      v-if="note.editedAt && note.editedAt !== note.createdAt"
                      @click="showEditedTime(note)"
                      class="text-xs text-gray-400 hover:text-gray-600"
                      :title="`Edited: ${formatDateTime(note.editedAt)}`"
                    >
                      (edited)
                    </button>
                  </div>
                  <p class="text-gray-700 text-sm whitespace-pre-wrap">{{ note.text }}</p>
                </div>
              </div>
              <div v-else class="text-center py-8 text-gray-400">
                No notes yet. Add your first note above.
              </div>
            </div>
          </div>
        </div>

        <!-- Bookings Section -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold">📅 Bookings</h2>
            <button class="text-sage-600 hover:text-sage-700 text-sm font-medium">
              + New Booking
            </button>
          </div>
          <div class="card-body">
            <div v-if="bookings.length === 0" class="text-gray-500 text-center py-8">
              No bookings yet
            </div>
            <div v-else class="space-y-4">
              <div v-for="booking in bookings" :key="booking.id" class="border-b pb-4 last:border-0">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium">{{ formatDateTime(booking.startTime) }}</p>
                    <p class="text-sm text-gray-500">Duration: {{ calculateDuration(booking.startTime, booking.endTime) }} minutes</p>
                  </div>
                  <span :class="['badge', getStatusClass(booking.status)]">
                    {{ booking.status }}
                  </span>
                </div>
                <p v-if="booking.notes" class="text-sm text-gray-600 mt-2">{{ booking.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Communications Section -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold">✉️ Communications</h2>
            <button class="text-sage-600 hover:text-sage-700 text-sm font-medium">
              + Send Email
            </button>
          </div>
          <div class="card-body">
            <div v-if="communications.length === 0" class="text-gray-500 text-center py-8">
              No communications yet
            </div>
            <div v-else class="space-y-4">
              <div v-for="comm in communications" :key="comm.id" class="border-b pb-4 last:border-0">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <p class="font-medium text-sm">{{ comm.subject }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ formatDateTime(comm.sentAt) }} • To: {{ comm.toEmail }}</p>
                  </div>
                  <span :class="['badge text-xs', getCommStatusClass(comm.status)]">
                    {{ comm.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Quick Actions</h3>
          </div>
          <div class="card-body space-y-3">
            <button class="btn-primary w-full text-sm">
              ✉️ Send Email
            </button>
            <button class="btn-secondary w-full text-sm">
              📅 New Booking
            </button>
            <button class="btn-secondary w-full text-sm">
              📄 Add Document
            </button>
            <button @click="confirmDelete" class="btn-danger w-full text-sm">
              🗑️ Delete Client
            </button>
          </div>
        </div>

        <!-- Client Stats -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Statistics</h3>
          </div>
          <div class="card-body space-y-4">
            <div>
              <p class="text-sm text-gray-500">Total Bookings</p>
              <p class="text-2xl font-bold text-sage-600">{{ bookings.length }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Confirmed</p>
              <p class="text-lg font-semibold">{{ bookings.filter(b => b.status === 'CONFIRMED').length }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Communications</p>
              <p class="text-lg font-semibold">{{ communications.length }}</p>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Info</h3>
          </div>
          <div class="card-body space-y-3 text-sm">
            <div>
              <p class="text-gray-500">Joined</p>
              <p class="font-medium">{{ formatDate(clientsStore.currentClient.createdAt) }}</p>
            </div>
            <div>
              <p class="text-gray-500">Last Updated</p>
              <p class="font-medium">{{ formatDate(clientsStore.currentClient.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Form Modal -->
    <ClientForm
      v-if="editMode && clientsStore.currentClient"
      :client="clientsStore.currentClient"
      @close="editMode = false"
      @saved="handleClientSaved"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-4">Delete Client?</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{{ clientsStore.currentClient?.firstName }} {{ clientsStore.currentClient?.lastName }}</strong>? This action cannot be undone.
        </p>
        <div class="flex gap-3 justify-end">
          <button @click="showDeleteConfirm = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="deleteClient" :disabled="deletingClient" class="btn-danger">
            {{ deletingClient ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { apiService } from '@/services/api'
import { formatDistanceToNow, format } from 'date-fns'
import type { Booking, Communication } from '@/types'
import ClientForm from '@/components/ClientForm.vue'

const route = useRoute()
const router = useRouter()
const clientsStore = useClientsStore()
const editMode = ref(false)
const showDeleteConfirm = ref(false)
const deletingClient = ref(false)
const bookings = ref<Booking[]>([])
const communications = ref<Communication[]>([])
const newNote = ref('')
const addingNote = ref(false)
const notesList = ref<Array<{ text: string; createdAt: string; editedAt?: string }>>([])
const selectedNoteEditTime = ref<string | null>(null)

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatDateTime(date: string) {
  return format(new Date(date), 'MMM dd, yyyy • h:mm a')
}

function formatDateOnly(date: string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

function calculateDuration(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function getStatusClass(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'badge-success'
    case 'PENDING':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-danger'
    default:
      return ''
  }
}

function getCommStatusClass(status: string) {
  switch (status) {
    case 'SENT':
      return 'badge-success'
    case 'DRAFT':
      return 'badge-warning'
    case 'FAILED':
      return 'badge-danger'
    default:
      return ''
  }
}

function handleClientSaved() {
  editMode.value = false
  clientsStore.fetchClient(route.params.id as string)
}

async function loadClientData() {
  const clientId = route.params.id as string

  try {
    // Load bookings for this client
    const allBookings = await apiService.getBookings()
    bookings.value = allBookings.filter(b => b.clientId === clientId)

    // Load communications for this client
    communications.value = await apiService.getClientCommunications(clientId)
  } catch (error) {
    console.error('Failed to load client data:', error)
  }
}

function loadNotes() {
  if (!clientsStore.currentClient) return

  try {
    // Try to parse notes as JSON array (new format)
    if (clientsStore.currentClient.notes && typeof clientsStore.currentClient.notes === 'string') {
      const parsed = JSON.parse(clientsStore.currentClient.notes)
      if (Array.isArray(parsed)) {
        notesList.value = parsed.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        return
      }
    }
  } catch (e) {
    // Not JSON, treat as legacy string format
  }

  // Fallback: if notes is a string, create a single note entry
  if (clientsStore.currentClient.notes && typeof clientsStore.currentClient.notes === 'string') {
    notesList.value = [{
      text: clientsStore.currentClient.notes,
      createdAt: clientsStore.currentClient.createdAt,
    }]
  } else {
    notesList.value = []
  }
}

async function addNote() {
  if (!newNote.value.trim() || !clientsStore.currentClient) return

  addingNote.value = true
  try {
    const now = new Date().toISOString()
    const note = {
      text: newNote.value.trim(),
      createdAt: now,
    }

    // Add to local list
    notesList.value.unshift(note)

    // Store as JSON array in the notes field
    const updatedNotes = JSON.stringify(notesList.value)

    // Update on server
    await clientsStore.updateClient(clientsStore.currentClient.id, {
      firstName: clientsStore.currentClient.firstName,
      lastName: clientsStore.currentClient.lastName,
      email: clientsStore.currentClient.email,
      notes: updatedNotes,
    })

    newNote.value = ''
  } catch (error) {
    console.error('Failed to add note:', error)
    // Rollback
    notesList.value.shift()
  } finally {
    addingNote.value = false
  }
}

function showEditedTime(note: any) {
  selectedNoteEditTime.value = note.editedAt || null
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

async function deleteClient() {
  if (!clientsStore.currentClient) return

  deletingClient.value = true
  try {
    await clientsStore.deleteClient(clientsStore.currentClient.id)
    router.push('/clients')
  } catch (error) {
    console.error('Failed to delete client:', error)
  } finally {
    deletingClient.value = false
  }
}

onMounted(async () => {
  const clientId = route.params.id as string
  await clientsStore.fetchClient(clientId)
  await loadClientData()
  loadNotes()
})
</script>
