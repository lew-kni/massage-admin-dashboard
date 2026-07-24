<template>
  <div class="p-8 dark:text-gray-50">
    <div class="flex justify-between items-center mb-8">
      <RouterLink to="/clients" class="text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300">
<i class="fas fa-arrow-left mr-1"></i>Back to Clients
      </RouterLink>
      <button v-if="clientsStore.currentClient" @click="editMode = true" class="btn-secondary text-sm">
        <i class="fas fa-edit"></i>
        <span>Edit</span>
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

            <!-- Emergency Contact & GP -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-3">Emergency Contact &amp; GP</h3>
              <p class="text-xs text-gray-500 mb-3">Kept up to date via the client's pre-visit form -- any change there is logged below in Notes.</p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Emergency contact</p>
                  <p class="font-medium">
                    <template v-if="clientsStore.currentClient.emergencyName || clientsStore.currentClient.emergencyPhone">
                      {{ [clientsStore.currentClient.emergencyName, clientsStore.currentClient.emergencyRelationship ? `(${clientsStore.currentClient.emergencyRelationship})` : null].filter(Boolean).join(' ') }}
                      <a v-if="clientsStore.currentClient.emergencyPhone" :href="`tel:${clientsStore.currentClient.emergencyPhone}`" class="text-sage-600 hover:underline block">
                        {{ clientsStore.currentClient.emergencyPhone }}
                      </a>
                    </template>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">GP</p>
                  <p class="font-medium">
                    <template v-if="clientsStore.currentClient.gpName || clientsStore.currentClient.gpPhone">
                      {{ clientsStore.currentClient.gpName }}
                      <a v-if="clientsStore.currentClient.gpPhone" :href="`tel:${clientsStore.currentClient.gpPhone}`" class="text-sage-600 hover:underline block">
                        {{ clientsStore.currentClient.gpPhone }}
                      </a>
                      <span v-if="clientsStore.currentClient.gpSurgery" class="text-sm text-gray-500 block">{{ clientsStore.currentClient.gpSurgery }}</span>
                    </template>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Notes Timeline -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-4"><i class="fas fa-note-sticky mr-2"></i>Notes</h3>

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
                  <span v-if="addingNote">Adding...</span>
                  <template v-else><i class="fas fa-check"></i><span>Add Note</span></template>
                </button>
              </div>

              <!-- Notes List -->
              <div v-if="notesList.length > 0" class="space-y-4">
                <div
                  v-for="(note, index) in paginatedNotes"
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
                <Pagination v-model="notesPage" :total-pages="notesTotalPages" />
              </div>
              <div v-else class="text-center py-8 text-gray-400">
                No notes yet. Add your first note above.
              </div>
            </div>
          </div>
        </div>

        <!-- Leads Section -->
        <div v-if="clientLeads.length > 0" class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-inbox mr-2"></i>Leads</h2>
          </div>
          <div class="card-body space-y-1">
            <RouterLink
              v-for="lead in paginatedLeads"
              :key="lead.id"
              :to="`/leads/${lead.id}`"
              class="block border-b last:border-0 -mx-2 px-2 py-3 rounded hover:bg-gray-50 transition group"
            >
              <div class="flex justify-between items-start">
                <div class="min-w-0 flex-1">
                  <p class="font-medium group-hover:text-sage-600 truncate">{{ lead.message }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(lead.createdAt) }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span v-if="!lead.isRead" class="badge badge-warning">Unread</span>
                  <i class="fas fa-arrow-right text-gray-300 group-hover:text-sage-500"></i>
                </div>
              </div>
            </RouterLink>
            <Pagination v-model="leadsPage" :total-pages="leadsTotalPages" />
          </div>
        </div>

        <!-- Bookings Section -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-calendar-days mr-2"></i>Bookings</h2>
            <button @click="showNewBooking = true" class="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm font-medium">
              <i class="fas fa-plus"></i>
              <span>New Booking</span>
            </button>
          </div>
          <div class="card-body">
            <div v-if="bookings.length === 0" class="text-gray-500 text-center py-8">
              No bookings yet
            </div>
            <div v-else class="space-y-1">
              <RouterLink
                v-for="booking in paginatedBookings"
                :key="booking.id"
                :to="`/bookings/${booking.id}`"
                class="block border-b last:border-0 -mx-2 px-2 py-3 rounded hover:bg-gray-50 transition group"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium group-hover:text-sage-600">
                      #{{ booking.bookingNumber }} · {{ formatDateTime(booking.startTime) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      Duration: {{ calculateDuration(booking.startTime, booking.endTime) }} minutes
                      <span v-if="booking.service"> · {{ booking.service }}</span>
                    </p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span :class="['badge', getStatusClass(booking.status)]">
                      {{ booking.status }}
                    </span>
                    <i class="fas fa-arrow-right text-gray-300 group-hover:text-sage-500"></i>
                  </div>
                </div>
                <p v-if="booking.notes" class="text-sm text-gray-600 mt-2 line-clamp-2">{{ booking.notes }}</p>
              </RouterLink>
              <Pagination v-model="bookingsPage" :total-pages="bookingsTotalPages" />
            </div>
          </div>
        </div>

        <!-- Communications Section -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-envelope mr-2"></i>Communications</h2>
            <button @click="showSendEmail = true" class="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm font-medium">
              <i class="fas fa-plus"></i>
              <span>Send Email</span>
            </button>
          </div>
          <div class="card-body">
            <div v-if="communications.length === 0" class="text-gray-500 text-center py-8">
              No communications yet
            </div>
            <div v-else class="space-y-4">
              <div v-for="comm in paginatedCommunications" :key="comm.id" class="border-b pb-4 last:border-0">
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
              <Pagination v-model="communicationsPage" :total-pages="communicationsTotalPages" />
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
            <button @click="showSendEmail = true" class="btn-primary w-full text-sm">
              <i class="fas fa-envelope"></i>
              <span>Send Email</span>
            </button>
            <button @click="showNewBooking = true" class="btn-secondary w-full text-sm">
              <i class="fas fa-calendar-days"></i>
              <span>New Booking</span>
            </button>
            <button class="btn-secondary w-full text-sm">
              <i class="fas fa-file-lines"></i>
              <span>Add Document</span>
            </button>
            <button @click="confirmDelete" class="btn-danger w-full text-sm">
              <i class="fas fa-trash-alt"></i>
              <span>Delete Client</span>
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

    <!-- New Booking Modal -->
    <NewBookingModal
      v-if="showNewBooking && clientsStore.currentClient"
      :client="clientsStore.currentClient"
      @close="showNewBooking = false"
      @saved="handleBookingSaved"
    />

    <SendEmailModal
      v-if="showSendEmail && clientsStore.currentClient"
      :client="clientsStore.currentClient"
      @close="showSendEmail = false"
      @sent="handleEmailSent"
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
import { useLeadsStore } from '@/stores/leads'
import { apiService } from '@/services/api'
import { formatDistanceToNow, format } from 'date-fns'
import type { Booking, Communication, Lead } from '@/types'
import ClientForm from '@/components/ClientForm.vue'
import NewBookingModal from '@/components/NewBookingModal.vue'
import SendEmailModal from '@/components/SendEmailModal.vue'
import Pagination from '@/components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const clientsStore = useClientsStore()
const leadsStore = useLeadsStore()
const editMode = ref(false)
const showNewBooking = ref(false)
const showSendEmail = ref(false)
const showDeleteConfirm = ref(false)
const deletingClient = ref(false)
const bookings = ref<Booking[]>([])
const clientLeads = ref<Lead[]>([])
const communications = ref<Communication[]>([])
const newNote = ref('')
const addingNote = ref(false)
const notesList = ref<Array<{ text: string; createdAt: string; editedAt?: string }>>([])
const selectedNoteEditTime = ref<string | null>(null)

// Embedded component lists default to 3 per page
const COMPONENT_PAGE_SIZE = 3
const notesPage = ref(1)
const leadsPage = ref(1)
const bookingsPage = ref(1)
const communicationsPage = ref(1)

const notesTotalPages = computed(() => Math.max(1, Math.ceil(notesList.value.length / COMPONENT_PAGE_SIZE)))
const leadsTotalPages = computed(() => Math.max(1, Math.ceil(clientLeads.value.length / COMPONENT_PAGE_SIZE)))
const bookingsTotalPages = computed(() => Math.max(1, Math.ceil(bookings.value.length / COMPONENT_PAGE_SIZE)))
const communicationsTotalPages = computed(() => Math.max(1, Math.ceil(communications.value.length / COMPONENT_PAGE_SIZE)))

const paginatedNotes = computed(() =>
  notesList.value.slice((notesPage.value - 1) * COMPONENT_PAGE_SIZE, notesPage.value * COMPONENT_PAGE_SIZE)
)
const paginatedLeads = computed(() =>
  clientLeads.value.slice((leadsPage.value - 1) * COMPONENT_PAGE_SIZE, leadsPage.value * COMPONENT_PAGE_SIZE)
)
const paginatedBookings = computed(() =>
  bookings.value.slice((bookingsPage.value - 1) * COMPONENT_PAGE_SIZE, bookingsPage.value * COMPONENT_PAGE_SIZE)
)
const paginatedCommunications = computed(() =>
  communications.value.slice((communicationsPage.value - 1) * COMPONENT_PAGE_SIZE, communicationsPage.value * COMPONENT_PAGE_SIZE)
)

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

async function handleBookingSaved() {
  showNewBooking.value = false
  await loadClientData()
}

async function handleEmailSent() {
  showSendEmail.value = false
  await loadClientData()
}

async function loadClientData() {
  const clientId = route.params.id as string

  try {
    // Load bookings for this client
    const allBookings = await apiService.getBookings()
    bookings.value = allBookings.filter(b => b.clientId === clientId)

    // Load communications for this client
    communications.value = await apiService.getClientCommunications(clientId)

    // Load leads linked to this client
    clientLeads.value = await leadsStore.fetchLeadsForClient(clientId)
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
    notesPage.value = 1

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
