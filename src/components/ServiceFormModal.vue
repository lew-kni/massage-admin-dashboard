<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
      <div class="card-header flex justify-between items-center shrink-0">
        <h2 class="text-lg font-semibold">{{ service ? 'Edit Service' : 'New Service' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-5 overflow-y-auto">
        <!-- Name + Slug -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input v-model="form.name" type="text" class="input-field" required @input="onNameInput" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input v-model="form.slug" type="text" class="input-field" required :disabled="!!service" />
            <p v-if="service" class="text-xs text-gray-400 mt-1">Slug can't be changed after creation</p>
          </div>
        </div>

        <!-- Category + flags -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="form.category" class="input-field">
              <option value="relaxation">Relaxation</option>
              <option value="sports">Sports</option>
            </select>
          </div>
          <div class="flex items-end gap-6 pb-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.bookable" type="checkbox" class="w-4 h-4" /> Bookable
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4" /> Active
            </label>
          </div>
        </div>

        <!-- Summary -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Summary</label>
          <input v-model="form.summary" type="text" class="input-field" required />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea v-model="form.description" rows="4" class="input-field" placeholder="One paragraph per line"></textarea>
          <p class="text-xs text-gray-400 mt-1">One paragraph per line</p>
        </div>

        <!-- Good For -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Good for</label>
          <textarea v-model="form.goodFor" rows="3" class="input-field" placeholder="One item per line"></textarea>
          <p class="text-xs text-gray-400 mt-1">One item per line</p>
        </div>

        <!-- Durations -->
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Durations &amp; pricing</label>
            <button type="button" @click="addDuration" class="text-sage-600 hover:text-sage-700 text-sm font-medium">
              + Add duration
            </button>
          </div>
          <div v-if="form.durations.length === 0" class="text-sm text-gray-400 py-2">No durations yet</div>
          <div v-for="(d, i) in form.durations" :key="i" class="flex gap-2 items-start mb-2">
            <div class="w-24">
              <input v-model.number="d.minutes" type="number" min="1" placeholder="min" class="input-field text-sm" />
            </div>
            <div class="w-28">
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                <input v-model="d.price" type="number" min="0" placeholder="price" class="input-field text-sm pl-6" />
              </div>
            </div>
            <input v-model="d.note" type="text" placeholder="Note (optional)" class="input-field text-sm flex-1" />
            <button type="button" @click="removeDuration(i)" class="text-red-500 hover:text-red-700 px-2 py-2 text-sm">✕</button>
          </div>
          <p class="text-xs text-gray-400 mt-1">Leave price blank if it's still to be confirmed.</p>
        </div>

        <!-- Contraindication note -->
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraindication note</label>
          <input v-model="form.contraTitle" type="text" class="input-field mb-2" placeholder="Heading (optional — leave blank for a plain note)" />
          <textarea v-model="form.contraContent" rows="3" class="input-field" placeholder="One paragraph per line"></textarea>
        </div>

        <!-- Post-booking note -->
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Post-booking note</label>
          <input v-model="form.postTitle" type="text" class="input-field mb-2" placeholder="Heading (required to show this note)" />
          <textarea v-model="form.postContent" rows="3" class="input-field" placeholder="One paragraph per line"></textarea>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </form>

      <div class="card-header border-t border-b-0 flex gap-3 justify-end shrink-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button type="button" @click="submitForm" :disabled="loading" class="btn-primary">
          <span v-if="loading">Saving...</span>
          <span v-else>{{ service ? '✓ Save Changes' : '+ Create Service' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useServicesStore } from '@/stores/services'
import type { Service, ServiceCategory, ServiceDuration, NoteBlock } from '@/types'

const props = defineProps<{ service?: Service }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useServicesStore()
const loading = ref(false)
const error = ref('')

const linesToText = (lines?: string[] | null) => (lines || []).join('\n')
const textToLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

// Break the polymorphic contraindicationNote into a title + content textarea
function loadContra(note: Service['contraindicationNote']) {
  if (!note) return { title: '', content: '' }
  if (typeof note === 'string') return { title: '', content: note }
  return { title: note.title, content: linesToText(note.content) }
}

const contra = loadContra(props.service?.contraindicationNote)

const form = reactive({
  name: props.service?.name || '',
  slug: props.service?.slug || '',
  category: (props.service?.category || 'relaxation') as ServiceCategory,
  summary: props.service?.summary || '',
  description: linesToText(props.service?.description),
  goodFor: linesToText(props.service?.goodFor),
  bookable: props.service?.bookable ?? true,
  isActive: props.service?.isActive ?? true,
  contraTitle: contra.title,
  contraContent: contra.content,
  postTitle: props.service?.postBookingNote?.title || '',
  postContent: linesToText(props.service?.postBookingNote?.content),
  durations: (props.service?.durations || []).map((d) => ({
    id: d.id,
    minutes: d.minutes,
    price: d.price === null || d.price === undefined ? '' : String(d.price),
    note: d.note || '',
  })) as Array<{ id?: string; minutes: number | null; price: string; note: string }>,
})

function onNameInput() {
  // Auto-suggest a slug from the name only when creating a new service
  if (!props.service) {
    form.slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

function addDuration() {
  form.durations.push({ minutes: null, price: '', note: '' })
}

function removeDuration(i: number) {
  form.durations.splice(i, 1)
}

function buildContra(): string | NoteBlock | null {
  const lines = textToLines(form.contraContent)
  if (form.contraTitle.trim()) {
    return { title: form.contraTitle.trim(), content: lines }
  }
  return lines.length ? lines.join('\n') : null
}

function buildPostNote(): NoteBlock | null {
  const lines = textToLines(form.postContent)
  if (form.postTitle.trim() && lines.length) {
    return { title: form.postTitle.trim(), content: lines }
  }
  return null
}

function collectDurations(): ServiceDuration[] {
  return form.durations
    .filter((d) => d.minutes != null && d.minutes > 0)
    .map((d, idx) => ({
      minutes: Number(d.minutes),
      price: d.price === '' ? null : Number(d.price),
      note: d.note.trim() || null,
      sortOrder: idx,
    }))
}

async function submitForm() {
  if (!form.name.trim() || !form.slug.trim() || !form.summary.trim()) {
    error.value = 'Name, slug, and summary are required'
    return
  }
  const durations = collectDurations()
  const scalar = {
    name: form.name.trim(),
    category: form.category,
    summary: form.summary.trim(),
    description: textToLines(form.description),
    goodFor: textToLines(form.goodFor),
    contraindicationNote: buildContra(),
    postBookingNote: buildPostNote(),
    bookable: form.bookable,
    isActive: form.isActive,
  }

  loading.value = true
  error.value = ''
  try {
    if (props.service) {
      await store.updateService(props.service.id, scalar)
      // Reconcile durations: delete removed, upsert the rest
      const originalIds = (props.service.durations || []).map((d) => d.id).filter(Boolean) as string[]
      const keptIds = form.durations.map((d) => d.id).filter(Boolean) as string[]
      for (const id of originalIds) {
        if (!keptIds.includes(id)) {
          await store.deleteDuration(props.service.id, id)
        }
      }
      for (const d of durations) {
        await store.upsertDuration(props.service.id, d)
      }
      await store.fetchServices()
    } else {
      await store.createService({ ...scalar, slug: form.slug.trim(), durations })
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.message || 'Failed to save service'
  } finally {
    loading.value = false
  }
}
</script>
