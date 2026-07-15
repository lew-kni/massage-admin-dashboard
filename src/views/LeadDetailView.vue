<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <RouterLink to="/leads" class="text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300">
        <i class="fas fa-arrow-left mr-1"></i>Back to Leads
      </RouterLink>
      <div v-if="lead" class="flex items-center gap-3">
        <button
          @click="leadsStore.setRead(lead.id, !lead.isRead)"
          class="btn-secondary text-sm"
        >
          <i :class="lead.isRead ? 'fas fa-envelope' : 'fas fa-envelope-open'"></i>
          <span>{{ lead.isRead ? 'Mark as unread' : 'Mark as read' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="leadsStore.loading && !lead" class="text-center py-12">
      <p class="text-gray-500">Loading lead...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!lead" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">Lead not found.</p>
    </div>

    <!-- Lead Details -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Enquiry Card -->
        <div class="card">
          <div class="card-header flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-semibold">{{ lead.name }}</h2>
              <p class="text-gray-500 text-sm mt-1">Submitted {{ formatDateTime(lead.createdAt) }} ({{ formatRelative(lead.createdAt) }})</p>
            </div>
            <span v-if="lead.service" class="badge badge-success">{{ formatService(lead.service) }}</span>
          </div>
          <div class="card-body space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-medium">
                  <a v-if="lead.email" :href="`mailto:${lead.email}`" class="text-sage-600 hover:underline break-all">{{ lead.email }}</a>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Phone</p>
                <p class="font-medium">
                  <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="text-sage-600 hover:underline">{{ lead.phone }}</a>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
              </div>
              <div v-if="lead.location">
                <p class="text-sm text-gray-500">Location</p>
                <p class="font-medium"><i class="fas fa-location-dot mr-1 text-gray-400"></i>{{ lead.location }}</p>
              </div>
            </div>
            <div class="border-t pt-4 dark:border-gray-700">
              <p class="text-sm text-gray-500">Message</p>
              <p class="font-medium whitespace-pre-wrap">{{ lead.message }}</p>
            </div>
            <div v-if="lead.healthNotes" class="border-t pt-4 dark:border-gray-700">
              <p class="text-sm text-gray-500">Health / contraindication notes</p>
              <p class="font-medium whitespace-pre-wrap">{{ lead.healthNotes }}</p>
            </div>
          </div>
        </div>

        <!-- Reply Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-reply mr-2"></i>Reply</h2>
          </div>
          <div class="card-body space-y-4">
            <!-- Reply history -->
            <div v-if="lead.replies && lead.replies.length > 0" class="space-y-3 mb-2">
              <div v-for="reply in lead.replies" :key="reply.id" class="border-l-4 border-sage-300 pl-4 py-2">
                <div class="flex justify-between items-start">
                  <p class="font-medium text-sm">{{ reply.subject }}</p>
                  <p class="text-xs text-gray-400 shrink-0 ml-2">{{ formatRelative(reply.createdAt) }}</p>
                </div>
                <p class="text-sm text-gray-600 whitespace-pre-wrap mt-1">{{ reply.body }}</p>
              </div>
            </div>

            <div v-if="!lead.email" class="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p class="text-sm text-yellow-700">This lead didn't provide an email address, so a reply can't be sent from here.</p>
            </div>
            <form v-else @submit.prevent="sendReply" class="space-y-3 border-t pt-4 dark:border-gray-700">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input v-model="replyForm.subject" type="text" class="input-field" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea v-model="replyForm.body" rows="5" class="input-field" required placeholder="Write your reply..."></textarea>
              </div>
              <div v-if="replyError" class="p-3 bg-red-50 border border-red-200 rounded">
                <p class="text-sm text-red-700">{{ replyError }}</p>
              </div>
              <div class="flex justify-end">
                <button type="submit" :disabled="sending" class="btn-primary">
                  <i class="fas fa-paper-plane"></i>
                  <span>{{ sending ? 'Sending...' : 'Send Reply' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Client Match</h3>
          </div>
          <div class="card-body">
            <div v-if="lead.client">
              <p class="font-medium">{{ lead.client.firstName }} {{ lead.client.lastName }}</p>
              <p class="text-sm text-gray-500">{{ lead.client.email }}</p>
              <RouterLink :to="`/clients/${lead.client.id}`" class="inline-flex items-center gap-1 mt-3 text-sage-600 hover:text-sage-700 text-sm font-medium">
                <i class="fas fa-user"></i>
                <span>View Client Profile</span>
              </RouterLink>
            </div>
            <p v-else class="text-sm text-gray-400">No matching client found for this lead's email/phone.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useLeadsStore } from '@/stores/leads'
import { format, formatDistanceToNow } from 'date-fns'

const route = useRoute()
const leadsStore = useLeadsStore()

const lead = computed(() => leadsStore.currentLead)
const sending = ref(false)
const replyError = ref('')
const replyForm = reactive({ subject: '', body: '' })

function formatService(service: string) {
  if (service === 'relaxation-massage') return 'Relaxation Massage'
  if (service === 'sports-massage') return 'Sports Massage'
  if (service === 'not-sure') return 'Not sure yet'
  return service
}

function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatDateTime(date: string) {
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

async function sendReply() {
  if (!lead.value) return
  sending.value = true
  replyError.value = ''
  try {
    await leadsStore.replyToLead(lead.value.id, { subject: replyForm.subject, body: replyForm.body })
    replyForm.subject = ''
    replyForm.body = ''
  } catch (err: any) {
    replyError.value = err?.message || 'Failed to send reply'
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  const id = route.params.id as string
  await leadsStore.fetchLead(id)
  if (leadsStore.currentLead && !leadsStore.currentLead.isRead) {
    leadsStore.setRead(id, true)
  }
  if (leadsStore.currentLead) {
    replyForm.subject = `Re: Your enquiry about ${leadsStore.currentLead.service ? formatService(leadsStore.currentLead.service) : 'massage services'}`
  }
})
</script>
