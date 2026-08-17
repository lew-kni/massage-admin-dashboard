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
            <p class="text-xs text-gray-400 mt-1">Picking a template fills the subject and message below with the full branded email. You can edit both before sending.</p>
          </div>

          <!-- Booking picker: appointment templates need to know which booking. -->
          <div v-if="showBookingPicker">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Which appointment is this about?
            </label>
            <select v-if="bookings.length" v-model="selectedBookingId" class="input-field">
              <option value="">Select a booking…</option>
              <option v-for="b in bookings" :key="b.id" :value="b.id">{{ bookingLabel(b) }}</option>
            </select>
            <p v-else class="text-sm text-amber-600">
              <i class="fas fa-triangle-exclamation mr-1"></i>This client has no bookings to reference. Pick a different template or write your own.
            </p>
            <p v-if="bookings.length && !selectedBookingId" class="text-xs text-amber-600 mt-1">
              This template refers to an appointment — choose one to fill in the date, service, price and pre-visit form link.
            </p>
          </div>

          <!-- Fixed booking context (composing from a booking page) -->
          <div v-else-if="props.booking && needsBooking" class="text-xs text-gray-400 -mt-2">
            <i class="fas fa-calendar-check mr-1"></i>Referring to {{ bookingLabel(props.booking) }}
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <input v-model="subject" type="text" class="input-field" placeholder="Email subject" />
          </div>

          <!-- Body -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <div v-if="rendering" class="border rounded-md dark:border-gray-700 min-h-[220px] flex items-center justify-center text-sm text-gray-400">
              <i class="fas fa-spinner fa-spin mr-2"></i>Building email…
            </div>
            <RichTextEditor v-else ref="editorRef" v-model="body" />
            <p class="text-xs text-gray-400 mt-1">Sent inside the branded North Peak Massage email template. Use the toolbar to format text.</p>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- Live preview -->
        <div class="lg:border-l lg:pl-6 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live preview</p>
          <EmailPreview :subject="subject" :body-html="body" />
        </div>
      </div>

      <div class="card-body flex gap-3 justify-end pt-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button
          type="button"
          @click="send"
          :disabled="!canSend"
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
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import type { Client, Booking, EmailTemplate } from '@/types'
import EmailPreview from '@/components/EmailPreview.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'

const props = defineProps<{ client: Client; booking?: Booking; bookings?: Booking[] }>()
const emit = defineEmits<{ close: []; sent: [] }>()

const templates = ref<EmailTemplate[]>([])
const selectedTemplateId = ref('')
const selectedBookingId = ref('')
const subject = ref('')
const body = ref('')
const sending = ref(false)
const rendering = ref(false)
const error = ref('')
const needsBooking = ref(false)
const editorRef = ref<InstanceType<typeof RichTextEditor>>()

// Variables that can only be resolved against a specific booking. Mirrors the
// backend's BOOKING_SCOPED_VARIABLES so the composer can prompt for a booking
// before it even calls the server.
const BOOKING_VARS = [
  'service', 'duration', 'date', 'time', 'pricingDetails',
  'paymentDetails', 'preFormButton', 'preFormLink', 'bookingRef', 'feeDetails',
]

// The client's bookings, for the "which appointment?" picker. Empty when the
// modal is opened without them (e.g. from a context that has no list).
const bookings = computed<Booking[]>(() => props.bookings ?? [])

// The booking we'll resolve appointment variables against: an explicitly picked
// one, or the fixed booking the modal was opened with.
const effectiveBookingId = computed(() => selectedBookingId.value || props.booking?.id || '')

// Show the picker only when the template needs a booking, we don't already have
// one fixed by context, and the client actually has bookings to choose from —
// otherwise fall through to the "no bookings" note the picker renders.
const showBookingPicker = computed(
  () => needsBooking.value && !props.booking && (bookings.value.length > 0 || selectedTemplateId.value !== ''),
)

const canSend = computed(() =>
  !sending.value &&
  !rendering.value &&
  !!client.value?.email &&
  !!subject.value.trim() &&
  !!body.value.trim() &&
  // If the template is appointment-scoped, a booking must be chosen first.
  (!needsBooking.value || !!effectiveBookingId.value),
)

const client = computed(() => props.client)

function templateLabel(t: EmailTemplate) {
  const pretty = t.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return `${pretty} — ${t.subject}`
}

function bookingLabel(b: Booking) {
  const when = format(new Date(b.startTime), 'd MMM yyyy, h:mm a')
  const svc = b.service || 'Massage'
  return `${when} · ${svc} · ${b.status.toLowerCase()}`
}

function templateNeedsBooking(t: EmailTemplate) {
  // The variables a template references: its declared list plus any actual
  // {{ token }} placeholders in the subject/body. Matching real placeholders
  // (not bare substrings) avoids prose words like "update"/"time" tripping it.
  const refs = new Set<string>(Array.isArray(t.variables) ? t.variables : [])
  const re = /{{\s*([\w.]+)\s*}}/g
  for (const text of [t.subject || '', t.body || '']) {
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) refs.add(m[1])
  }
  return BOOKING_VARS.some((v) => refs.has(v))
}

async function applyTemplate() {
  error.value = ''
  const t = templates.value.find((x) => x.id === selectedTemplateId.value)
  if (!t) {
    // "Blank — write your own"
    needsBooking.value = false
    subject.value = ''
    body.value = ''
    return
  }
  needsBooking.value = templateNeedsBooking(t)
  if (needsBooking.value && !effectiveBookingId.value) {
    // Wait for the user to pick a booking; render fires from the watcher below.
    return
  }
  await renderSelected()
}

async function renderSelected() {
  if (!selectedTemplateId.value) return
  rendering.value = true
  error.value = ''
  try {
    const res = await apiService.renderTemplate({
      clientId: client.value.id,
      templateId: selectedTemplateId.value,
      bookingId: effectiveBookingId.value || undefined,
    })
    needsBooking.value = res.needsBooking
    subject.value = res.subject
    body.value = res.body
  } catch (err: any) {
    if (err?.response?.status === 422) {
      needsBooking.value = true // backend says a booking is required
    } else {
      error.value = err?.response?.data?.error || err?.message || 'Failed to build email'
    }
  } finally {
    rendering.value = false
  }
}

// Once a booking is chosen for an appointment template, render against it.
function onBookingChosen() {
  if (selectedBookingId.value && selectedTemplateId.value && needsBooking.value) {
    renderSelected()
  }
}

async function send() {
  if (!client.value.email) return
  sending.value = true
  error.value = ''
  try {
    const html = editorRef.value?.getSanitizedHtml() ?? body.value
    await apiService.sendEmail({
      clientId: client.value.id,
      subject: subject.value.trim(),
      body: html,
    })
    emit('sent')
    emit('close')
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to send email'
  } finally {
    sending.value = false
  }
}

// Once a booking is chosen for an appointment template, render against it.
watch(selectedBookingId, onBookingChosen)

onMounted(async () => {
  try {
    templates.value = await apiService.getTemplates()
  } catch {
    // Non-fatal — user can still write a blank email
  }
})
</script>
