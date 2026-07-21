<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ promotion ? 'Edit Promotion' : 'New Promotion' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- Message -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <input v-model="form.message" type="text" class="input-field" required placeholder="e.g. 50% off Sports Massage sessions!" />
        </div>

        <!-- Discount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
          <input v-model.number="form.discountPercentage" type="number" min="0" max="100" class="input-field" required />
        </div>

        <!-- Applies to -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Applies to</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="all" v-model="scope" /> All services
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="specific" v-model="scope" /> Specific services
            </label>
          </div>
          <div v-if="scope === 'specific'" class="mt-2 pl-6 space-y-1">
            <label v-for="s in store.services" :key="s.id" class="flex items-center gap-2 text-sm">
              <input type="checkbox" :value="s.slug" v-model="selectedSlugs" /> {{ s.name }}
            </label>
            <p v-if="store.services.length === 0" class="text-xs text-gray-400">No services available</p>
          </div>
        </div>

        <!-- More info modal content -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            "More info" modal content <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            v-model="detailsText"
            rows="5"
            class="input-field"
            placeholder="Extra detail shown when a visitor clicks &quot;More info&quot; on the promotion banner. Separate paragraphs with a blank line. Leave empty to just show the message above."
          ></textarea>
        </div>

        <!-- Active -->
        <label class="flex items-center gap-2 text-sm pt-2 border-t">
          <input v-model="form.active" type="checkbox" class="w-4 h-4" /> Active (usable for pricing)
        </label>

        <!-- Internal -->
        <label class="flex items-start gap-2 text-sm">
          <input v-model="form.internal" type="checkbox" class="w-4 h-4 mt-0.5" />
          <span>
            Internal only
            <span class="block text-xs text-gray-500 font-normal">
              Never shown on the website — for one-off discounts you apply yourself, e.g. comping a friend's booking. Still needs "Active" checked to be usable.
            </span>
          </span>
        </label>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading">Saving...</span>
            <template v-else-if="promotion"><i class="fas fa-check"></i><span>Save</span></template>
            <template v-else><i class="fas fa-plus"></i><span>Create</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useServicesStore } from '@/stores/services'
import type { Promotion } from '@/types'

const props = defineProps<{ promotion?: Promotion }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useServicesStore()
const loading = ref(false)
const error = ref('')

const initialSpecific = Array.isArray(props.promotion?.applicableTo)
const scope = ref<'all' | 'specific'>(initialSpecific ? 'specific' : 'all')
const selectedSlugs = ref<string[]>(
  Array.isArray(props.promotion?.applicableTo) ? [...(props.promotion!.applicableTo as string[])] : []
)

const form = reactive({
  message: props.promotion?.message || '',
  discountPercentage: props.promotion?.discountPercentage ?? 0,
  active: props.promotion?.active ?? false,
  internal: props.promotion?.internal ?? false,
})

// A single textarea is friendlier to fill in than a repeatable list of
// fields — paragraphs are just separated by a blank line, same as writing
// an email. Joined/split at the boundary with the API's string[] shape.
const detailsText = ref(props.promotion?.details?.join('\n\n') || '')

async function submitForm() {
  if (!form.message.trim()) {
    error.value = 'Message is required'
    return
  }
  if (scope.value === 'specific' && selectedSlugs.value.length === 0) {
    error.value = 'Select at least one service, or choose "All services"'
    return
  }

  const details = detailsText.value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const payload: Partial<Promotion> = {
    message: form.message.trim(),
    discountPercentage: form.discountPercentage,
    active: form.active,
    internal: form.internal,
    applicableTo: scope.value === 'all' ? 'all' : selectedSlugs.value,
    details: details.length ? details : null,
  }

  loading.value = true
  error.value = ''
  try {
    if (props.promotion) {
      await store.updatePromotion(props.promotion.id, payload)
    } else {
      await store.createPromotion(payload)
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.message || 'Failed to save promotion'
  } finally {
    loading.value = false
  }
}
</script>
