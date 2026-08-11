<template>
  <div class="card">
    <div class="card-header flex justify-between items-center">
      <h3 class="font-semibold"><i class="fas fa-file-lines mr-2"></i>Documents</h3>
      <label class="btn-secondary text-sm cursor-pointer mb-0">
        <i class="fas fa-paperclip"></i>
        <span>{{ uploading ? 'Uploading…' : 'Upload' }}</span>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          :disabled="uploading"
          @change="onFileChosen"
        />
      </label>
    </div>

    <div class="card-body space-y-3">
      <!-- Type picker shown once a file is chosen, before it uploads -->
      <div v-if="pendingFile" class="p-3 rounded-lg bg-sage-50 dark:bg-gray-800 space-y-3">
        <p class="text-sm text-gray-700 dark:text-gray-200 truncate">
          <i class="fas fa-file mr-1"></i>{{ pendingFile.name }}
          <span class="text-gray-400">({{ formatSize(pendingFile.size) }})</span>
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="pendingType" class="input-field text-sm !w-auto">
            <option v-for="opt in DOC_TYPES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button @click="confirmUpload" :disabled="uploading" class="btn-primary text-sm">
            {{ uploading ? 'Uploading…' : 'Upload' }}
          </button>
          <button @click="cancelPending" :disabled="uploading" class="btn-secondary text-sm">Cancel</button>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

      <div v-if="loading" class="text-sm text-gray-500 py-2">Loading documents…</div>

      <p v-else-if="!documents.length && !pendingFile" class="text-sm text-gray-500 text-center py-4">
        No documents uploaded yet
      </p>

      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
        <li v-for="doc in documents" :key="doc.id" class="py-3 flex items-center gap-3">
          <i :class="['fas text-lg text-gray-400', fileIcon(doc.fileType)]"></i>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium truncate">{{ doc.fileName }}</p>
            <p class="text-xs text-gray-500">
              <span class="badge bg-sage-100 text-sage-800 mr-1">{{ docTypeLabel(doc.docType) }}</span>
              {{ formatSize(doc.fileSize) }} · {{ formatDate(doc.uploadedAt) }}
              <span v-if="showBookingTag && doc.booking"> · booking #{{ doc.booking.bookingNumber }}</span>
            </p>
          </div>
          <button @click="view(doc)" class="text-sage-600 hover:text-sage-700 text-sm" title="View / download">
            <i class="fas fa-arrow-up-right-from-square"></i>
          </button>
          <button @click="remove(doc)" class="text-red-600 hover:text-red-700 text-sm" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import type { Document, DocumentType } from '@/types'

// bookingId present → this panel lives on a booking and lists that booking's
// documents (uploads are tagged to it). Absent → it lives on a client and lists
// every document for the client, tagging each with its booking if any.
const props = defineProps<{ clientId: string; bookingId?: string }>()

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'REFERRAL', label: 'Referral letter' },
  { value: 'GP_LETTER', label: 'GP / consultant letter' },
  { value: 'CONSENT', label: 'Consent form' },
  { value: 'MEDICAL', label: 'Medical record' },
  { value: 'OTHER', label: 'Other' },
]

const documents = ref<Document[]>([])
const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingType = ref<DocumentType>('REFERRAL')

// On a booking panel we already know the booking, so tagging every row with it
// is noise; on a client panel it's useful context.
const showBookingTag = !props.bookingId

function docTypeLabel(t: DocumentType): string {
  return DOC_TYPES.find((d) => d.value === t)?.label || 'Document'
}

function fileIcon(fileType: string): string {
  return fileType === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string): string {
  return format(new Date(date), 'd MMM yyyy')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    documents.value = await apiService.getDocuments(
      props.bookingId ? { bookingId: props.bookingId } : { clientId: props.clientId }
    )
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to load documents'
  } finally {
    loading.value = false
  }
}

function onFileChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    pendingFile.value = file
    pendingType.value = 'REFERRAL'
    error.value = ''
  }
  // Reset so choosing the same file again re-triggers change.
  input.value = ''
}

function cancelPending() {
  pendingFile.value = null
}

async function confirmUpload() {
  if (!pendingFile.value) return
  uploading.value = true
  error.value = ''
  try {
    const created = await apiService.uploadDocument({
      file: pendingFile.value,
      clientId: props.clientId,
      bookingId: props.bookingId,
      docType: pendingType.value,
    })
    documents.value = [created, ...documents.value]
    pendingFile.value = null
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function view(doc: Document) {
  error.value = ''
  try {
    const { url } = await apiService.getDocumentFileUrl(doc.id)
    window.open(url, '_blank', 'noopener')
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Could not open the file'
  }
}

async function remove(doc: Document) {
  if (!confirm(`Delete "${doc.fileName}"? This can't be undone.`)) return
  error.value = ''
  try {
    await apiService.deleteDocument(doc.id)
    documents.value = documents.value.filter((d) => d.id !== doc.id)
  } catch (err: any) {
    error.value = err?.response?.data?.error || 'Failed to delete the document'
  }
}

onMounted(load)
</script>
