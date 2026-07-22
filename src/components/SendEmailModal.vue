<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
        <h2 class="text-lg font-semibold">Send Email</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <div class="card-body grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-5">
          <!-- Recipient -->
          <div class="pb-4 border-b dark:border-gray-700">
            <p class="text-sm text-gray-500">To</p>
            <p class="font-medium">{{ client.firstName }} {{ client.lastName }}</p>
            <p v-if="client.email" class="text-sm text-gray-500">{{ client.email }}</p>
            <p v-else class="text-sm text-red-600"><i class="fas fa-triangle-exclamation mr-1"></i>This client has no email address on file.</p>
          </div>

          <!-- Template picker -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
            <select v-model="selectedTemplateId" @change="applyTemplate" class="input-field">
              <option value="">Blank — write your own</option>
              <option v-for="t in templates" :key="t.id" :value="t.id">{{ templateLabel(t) }}</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">Picking a template fills the subject and message below. You can edit both before sending.</p>
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <input v-model="subject" type="text" class="input-field" placeholder="Email subject" />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea v-model="body" rows="10" class="input-field font-normal" placeholder="Write your message..."></textarea>
            <p class="text-xs text-gray-400 mt-1">Sent inside the branded North Peak Massage email template. Blank lines start a new paragraph.</p>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- Live preview -->
        <div class="lg:border-l lg:pl-6 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live preview</p>
          <EmailPreview :subject="subject" :body-html="textToHtml(body)" />
        </div>
      </div>

      <div class="card-body flex gap-3 justify-end pt-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button
          type="button"
          @click="send"
          :disabled="sending || !client.email || !subject.trim() || !body.trim()"
          class="btn-primary"
        >
          <i class="fas fa-paper-plane"></i>
          <span>{{ sending ? 'Sending...' : 'Send Email' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import type { Client, Booking, EmailTemplate } from '@/types'
import EmailPreview from '@/components/EmailPreview.vue'
import { htmlToText, textToHtml } from '@/utils/emailPreview'

const props = defineProps<{ client: Client; booking?: Booking }>()
const emit = defineEmits<{ close: []; sent: [] }>()

const templates = ref<EmailTemplate[]>([])
const selectedTemplateId = ref('')
const subject = ref('')
const body = ref('')
const sending = ref(false)
const error = ref('')

function templateLabel(t: EmailTemplate) {
  const pretty = t.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return `${pretty} — ${t.subject}`
}

// Substitute the variables we can resolve from the client; leave the rest for
// the user to fill in (e.g. {{ date }}, {{ time }}, {{ location }}).
function fillVars(text: string) {
  // Always resolvable from the client
  const vars: Record<string, string> = {
    firstName: props.client.firstName || '',
    lastName: props.client.lastName || '',
  }
  // Appointment variables only when composing in the context of a booking
  if (props.booking) {
    const start = new Date(props.booking.startTime)
    vars.date = format(start, 'EEEE, d MMMM yyyy')
    vars.time = format(start, 'h:mm a')
    const loc = props.booking.postcode || props.client.postcode || props.client.city || ''
    if (loc) vars.location = loc
  }
  // Substitute known variables; leave any others as {{ … }} for the user to fill
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
  }
  return result
}

function applyTemplate() {
  const t = templates.value.find((x) => x.id === selectedTemplateId.value)
  if (!t) return
  subject.value = fillVars(t.subject)
  body.value = fillVars(htmlToText(t.body))
}

async function send() {
  if (!props.client.email) return
  sending.value = true
  error.value = ''
  try {
    await apiService.sendEmail({
      clientId: props.client.id,
      subject: subject.value.trim(),
      body: textToHtml(body.value),
    })
    emit('sent')
    emit('close')
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to send email'
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  try {
    templates.value = await apiService.getTemplates()
  } catch {
    // Non-fatal — user can still write a blank email
  }
})
</script>
