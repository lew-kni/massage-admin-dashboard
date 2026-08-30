<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
      <div class="card-header flex justify-between items-center shrink-0">
        <h2 class="text-lg font-semibold">{{ service ? 'Edit Service' : 'New Service' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
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

        <!-- Benefits -->
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Benefits</label>
            <button type="button" @click="addBenefit" class="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm font-medium">
              <i class="fas fa-plus"></i>
              <span>Add benefit</span>
            </button>
          </div>
          <input v-model="form.benefitsTitle" type="text" placeholder="Section heading" class="input-field text-sm mb-2" />
          <p class="text-xs text-gray-400 mb-2">Heading shown above this section on the website</p>
          <div v-if="form.benefits.length === 0" class="text-sm text-gray-400 py-2">No benefits yet</div>
          <div v-for="(b, i) in form.benefits" :key="i" class="bg-gray-50 p-3 rounded mb-2 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <input v-model="b.title" type="text" placeholder="Title" class="input-field text-sm" />
              <input v-model="b.icon" type="text" placeholder="Icon (e.g. fa-heart-pulse)" class="input-field text-sm" />
            </div>
            <textarea v-model="b.description" rows="2" placeholder="Description" class="input-field text-sm w-full"></textarea>
            <div class="flex justify-end">
              <button type="button" @click="removeBenefit(i)" class="text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-1">Icon should be a Font Awesome class like "fa-heart-pulse" or "fa-bolt"</p>
        </div>

        <!-- Personas (Who this is for) -->
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Who this is for (Personas)</label>
            <button type="button" @click="addPersona" class="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm font-medium">
              <i class="fas fa-plus"></i>
              <span>Add persona</span>
            </button>
          </div>
          <input v-model="form.personasTitle" type="text" placeholder="Section heading" class="input-field text-sm mb-2" />
          <p class="text-xs text-gray-400 mb-2">Heading shown above this section on the website</p>
          <div v-if="form.personas.length === 0" class="text-sm text-gray-400 py-2">No personas yet</div>
          <div v-for="(p, i) in form.personas" :key="i" class="bg-gray-50 p-3 rounded mb-2 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <input v-model="p.title" type="text" placeholder="Title (e.g. Runners & Athletes)" class="input-field text-sm" />
              <input v-model="p.icon" type="text" placeholder="Icon (e.g. fa-person-running)" class="input-field text-sm" />
            </div>
            <textarea v-model="p.description" rows="2" placeholder="Description" class="input-field text-sm w-full"></textarea>
            <div class="flex justify-end">
              <button type="button" @click="removePersona(i)" class="text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-1">Icon should be a Font Awesome class like "fa-person-running" or "fa-dumbbell"</p>
        </div>

        <!-- Durations -->
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Durations &amp; pricing</label>
            <button type="button" @click="addDuration" class="inline-flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm font-medium">
              <i class="fas fa-plus"></i>
              <span>Add duration</span>
            </button>
          </div>
          <div v-if="form.durations.length === 0" class="text-sm text-gray-400 py-2">No durations yet</div>
          <div v-for="(d, i) in form.durations" :key="i" class="flex gap-2 items-start mb-2 flex-wrap">
            <div class="w-24">
              <input v-model.number="d.minutes" type="number" min="1" placeholder="min" class="input-field text-sm" />
            </div>
            <div class="w-28">
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                <input v-model="d.price" type="number" min="0" step="0.01" placeholder="price" class="input-field text-sm pl-6" />
              </div>
            </div>
            <input v-model="d.note" type="text" placeholder="Note (optional)" class="input-field text-sm flex-1 min-w-[8rem]" />
            <select v-model="d.promotionId" class="input-field text-sm w-44" title="Pin a promotion to just this duration">
              <option value="">No promotion</option>
              <option v-for="p in store.promotions" :key="p.id" :value="p.id">{{ p.message }}</option>
            </select>
            <button type="button" @click="removeDuration(i)" class="text-red-500 hover:text-red-700 px-2 py-2 text-sm"><i class="fas fa-xmark"></i></button>
          </div>
          <p class="text-xs text-gray-400 mt-1">Leave price blank if it's still to be confirmed. A duration's promotion overrides the service-wide one from the Promotions tab.</p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </form>

      <div class="card-header border-t border-b-0 flex gap-3 justify-end shrink-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
        <button type="button" @click="submitForm" :disabled="loading" class="btn-primary">
          <span v-if="loading">Saving...</span>
          <template v-else-if="service"><i class="fas fa-check"></i><span>Save Changes</span></template>
          <template v-else><i class="fas fa-plus"></i><span>Create Service</span></template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useServicesStore } from '@/stores/services'
import { penceToInput, poundsToPence } from '@/utils/money'
import type { Service, ServiceCategory, ServiceDuration, NoteBlock } from '@/types'

const props = defineProps<{ service?: Service }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useServicesStore()
const loading = ref(false)
const error = ref('')

const linesToText = (lines?: string[] | null) => (lines || []).join('\n')
const textToLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

const form = reactive({
  name: props.service?.name || '',
  slug: props.service?.slug || '',
  category: (props.service?.category || 'relaxation') as ServiceCategory,
  summary: props.service?.summary || '',
  description: linesToText(props.service?.description),
  bookable: props.service?.bookable ?? true,
  isActive: props.service?.isActive ?? true,
  benefits: (props.service?.benefits || []).map((b) => ({
    title: b.title || '',
    description: b.description || '',
    icon: b.icon || '',
  })) as Array<{ title: string; description: string; icon: string }>,
  benefitsTitle: props.service?.benefitsTitle || "What you'll get",
  personasTitle: props.service?.personasTitle || 'Who this is for',
  personas: (props.service?.personas || []).map((p) => ({
    title: p.title || '',
    description: p.description || '',
    icon: p.icon || '',
  })) as Array<{ title: string; description: string; icon: string }>,
  durations: (props.service?.durations || []).map((d) => ({
    id: d.id,
    minutes: d.minutes,
    // Stored in pence; the £ input edits pounds ("75.00").
    price: penceToInput(d.price),
    note: d.note || '',
    promotionId: d.promotionId || '',
  })) as Array<{ id?: string; minutes: number | null; price: string; note: string; promotionId: string }>,
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
  form.durations.push({ minutes: null, price: '', note: '', promotionId: '' })
}

function removeDuration(i: number) {
  form.durations.splice(i, 1)
}

function addBenefit() {
  form.benefits.push({ title: '', description: '', icon: '' })
}

function removeBenefit(i: number) {
  form.benefits.splice(i, 1)
}

function addPersona() {
  form.personas.push({ title: '', description: '', icon: '' })
}

function removePersona(i: number) {
  form.personas.splice(i, 1)
}

function collectDurations(): ServiceDuration[] {
  return form.durations
    .filter((d) => d.minutes != null && d.minutes > 0)
    .map((d, idx) => ({
      minutes: Number(d.minutes),
      price: poundsToPence(d.price),
      note: d.note.trim() || null,
      sortOrder: idx,
      promotionId: d.promotionId || null,
    }))
}

async function submitForm() {
  if (!form.name.trim() || !form.slug.trim() || !form.summary.trim()) {
    error.value = 'Name, slug, and summary are required'
    return
  }
  const durations = collectDurations()
  const benefits = form.benefits.filter(b => b.title.trim() || b.description.trim() || b.icon.trim()).map(b => ({
    title: b.title.trim() || null,
    description: b.description.trim() || null,
    icon: b.icon.trim() || null,
  }))
  const personas = form.personas.filter(p => p.title.trim() || p.description.trim() || p.icon.trim()).map(p => ({
    title: p.title.trim() || null,
    description: p.description.trim() || null,
    icon: p.icon.trim() || null,
  }))
  const scalar = {
    name: form.name.trim(),
    category: form.category,
    summary: form.summary.trim(),
    description: textToLines(form.description),
    benefits,
    benefitsTitle: form.benefitsTitle.trim() || undefined,
    personas,
    personasTitle: form.personasTitle.trim() || undefined,
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
