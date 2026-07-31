<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4 overflow-y-auto">
        <!-- Kind toggle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in kindOptions"
              :key="opt.value"
              type="button"
              @click="form.kind = opt.value"
              :class="['px-3 py-2 rounded border text-sm font-medium', form.kind === opt.value ? 'border-sage-500 bg-sage-50 dark:bg-gray-800 text-sage-700 dark:text-sage-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400']"
            >
              <i class="fas mr-1" :class="opt.icon"></i>{{ opt.label }}
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ isVoucher ? 'Redeemed with a code the customer types in — never advertised.' : 'Applied automatically to matching bookings, and shown on the site.' }}</p>
        </div>

        <!-- Message / applied text -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ isVoucher ? 'Text shown once applied' : 'Message' }}</label>
          <input v-model="form.message" type="text" class="input-field" required :placeholder="isVoucher ? 'e.g. £10 off — welcome back!' : 'e.g. 50% off Sports Massage sessions!'" />
        </div>

        <!-- Voucher code -->
        <div v-if="isVoucher">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
          <input v-model="form.code" type="text" class="input-field uppercase" required placeholder="e.g. WELCOME10" />
          <p class="text-xs text-gray-400 mt-1">Case-insensitive. What the customer enters on the booking form.</p>
        </div>

        <!-- Discount type + value -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
          <div class="flex gap-2">
            <div class="inline-flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                @click="form.discountType = 'PERCENT'"
                :class="['px-3 py-2 text-sm font-medium', form.discountType === 'PERCENT' ? 'bg-sage-500 text-white' : 'text-gray-600 dark:text-gray-400']"
              >%</button>
              <button
                type="button"
                @click="form.discountType = 'FIXED'"
                :class="['px-3 py-2 text-sm font-medium', form.discountType === 'FIXED' ? 'bg-sage-500 text-white' : 'text-gray-600 dark:text-gray-400']"
              >£</button>
            </div>
            <div class="relative flex-1">
              <span v-if="form.discountType === 'FIXED'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
              <input
                v-model.number="form.value"
                type="number"
                min="0"
                :max="form.discountType === 'PERCENT' ? 100 : undefined"
                class="input-field"
                :class="{ 'pl-7': form.discountType === 'FIXED' }"
                required
              />
              <span v-if="form.discountType === 'PERCENT'" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
        </div>

        <!-- Applies to (services) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Applies to</label>
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

        <!-- Applies to (durations) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durations</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="all" v-model="durationScope" /> All durations
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="specific" v-model="durationScope" /> Specific durations
            </label>
          </div>
          <div v-if="durationScope === 'specific'" class="mt-2 pl-6 flex flex-wrap gap-3">
            <label v-for="m in allDurations" :key="m" class="flex items-center gap-2 text-sm">
              <input type="checkbox" :value="m" v-model="selectedMinutes" /> {{ m }} min
            </label>
            <p v-if="allDurations.length === 0" class="text-xs text-gray-400">No durations available</p>
          </div>
        </div>

        <!-- Voucher: expiry + usage cap -->
        <template v-if="isVoucher">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires <span class="text-gray-400 font-normal">(optional)</span></label>
              <input v-model="form.expiresAt" type="date" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usage limit <span class="text-gray-400 font-normal">(optional)</span></label>
              <input v-model.number="form.usageLimit" type="number" min="1" class="input-field" placeholder="Unlimited" />
            </div>
          </div>
          <p v-if="promotion && promotion.kind === 'VOUCHER'" class="text-xs text-gray-500 -mt-2">
            Redeemed {{ promotion.usageCount ?? 0 }}{{ promotion.usageLimit ? ` of ${promotion.usageLimit}` : '' }} time{{ (promotion.usageCount ?? 0) === 1 ? '' : 's' }} so far.
          </p>
        </template>

        <!-- Promotion: banner + more-info + internal -->
        <template v-if="!isVoucher">
          <label class="flex items-start gap-2 text-sm">
            <input v-model="form.displayAsBanner" type="checkbox" class="w-4 h-4 mt-0.5" />
            <span>
              Display as banner sitewide
              <span class="block text-xs text-gray-500 font-normal">Shows this promotion in the banner across the brochure website. Needs "Active" too.</span>
            </span>
          </label>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              "More info" modal content <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              v-model="detailsText"
              rows="4"
              class="input-field"
              placeholder="Extra detail shown when a visitor clicks &quot;More info&quot; on the promotion banner. Separate paragraphs with a blank line."
            ></textarea>
          </div>
        </template>

        <!-- Active -->
        <label class="flex items-center gap-2 text-sm pt-2 border-t dark:border-gray-700">
          <input v-model="form.active" type="checkbox" class="w-4 h-4" /> Active (usable for pricing)
        </label>

        <!-- Internal (promotions only) -->
        <label v-if="!isVoucher" class="flex items-start gap-2 text-sm">
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

        <div class="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
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
import { reactive, ref, computed } from 'vue'
import { useServicesStore } from '@/stores/services'
import type { Promotion, PromotionKind } from '@/types'

const props = defineProps<{ promotion?: Promotion; initialKind?: PromotionKind }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useServicesStore()
const loading = ref(false)
const error = ref('')

const kindOptions = [
  { value: 'PROMOTION' as const, label: 'Promotion', icon: 'fa-tag' },
  { value: 'VOUCHER' as const, label: 'Voucher', icon: 'fa-ticket' },
]

// Service scope
const scope = ref<'all' | 'specific'>(Array.isArray(props.promotion?.applicableTo) ? 'specific' : 'all')
const selectedSlugs = ref<string[]>(
  Array.isArray(props.promotion?.applicableTo) ? [...(props.promotion!.applicableTo as string[])] : []
)

// Duration scope — the distinct set of lengths offered across all services.
const allDurations = computed(() => {
  const set = new Set<number>()
  store.services.forEach((s) => s.durations?.forEach((d) => set.add(d.minutes)))
  return [...set].sort((a, b) => a - b)
})
const durationScope = ref<'all' | 'specific'>(Array.isArray(props.promotion?.applicableDurations) ? 'specific' : 'all')
const selectedMinutes = ref<number[]>(
  Array.isArray(props.promotion?.applicableDurations) ? [...(props.promotion!.applicableDurations as number[])] : []
)

const form = reactive({
  kind: (props.promotion?.kind || props.initialKind || 'PROMOTION') as PromotionKind,
  message: props.promotion?.message || '',
  discountType: props.promotion?.discountType || 'PERCENT',
  // Single value bound to whichever discount type is active.
  value:
    props.promotion?.discountType === 'FIXED'
      ? props.promotion?.discountAmount ?? 0
      : props.promotion?.discountPercentage ?? 0,
  active: props.promotion?.active ?? false,
  internal: props.promotion?.internal ?? false,
  displayAsBanner: props.promotion?.displayAsBanner ?? false,
  code: props.promotion?.code || '',
  // <input type="date"> wants yyyy-mm-dd; the API returns a full ISO string.
  expiresAt: props.promotion?.expiresAt ? props.promotion.expiresAt.slice(0, 10) : '',
  usageLimit: props.promotion?.usageLimit ?? null,
})

const isVoucher = computed(() => form.kind === 'VOUCHER')
const title = computed(() => {
  const noun = isVoucher.value ? 'Voucher' : 'Promotion'
  return props.promotion ? `Edit ${noun}` : `New ${noun}`
})

// A single textarea is friendlier than a repeatable list — paragraphs are just
// separated by a blank line. Joined/split at the API's string[] boundary.
const detailsText = ref(props.promotion?.details?.join('\n\n') || '')

async function submitForm() {
  if (!form.message.trim()) {
    error.value = isVoucher.value ? 'Applied text is required' : 'Message is required'
    return
  }
  if (isVoucher.value && form.code.trim().length < 3) {
    error.value = 'A voucher needs a code of at least 3 characters'
    return
  }
  if (!(form.value >= 0) || (form.discountType === 'PERCENT' && form.value > 100)) {
    error.value = 'Enter a valid discount amount'
    return
  }
  if (scope.value === 'specific' && selectedSlugs.value.length === 0) {
    error.value = 'Select at least one service, or choose "All services"'
    return
  }
  if (durationScope.value === 'specific' && selectedMinutes.value.length === 0) {
    error.value = 'Select at least one duration, or choose "All durations"'
    return
  }

  const payload: Partial<Promotion> = {
    kind: form.kind,
    message: form.message.trim(),
    discountType: form.discountType,
    discountPercentage: form.discountType === 'PERCENT' ? form.value : 0,
    discountAmount: form.discountType === 'FIXED' ? form.value : null,
    active: form.active,
    applicableTo: scope.value === 'all' ? 'all' : selectedSlugs.value,
    applicableDurations: durationScope.value === 'all' ? 'all' : selectedMinutes.value,
  }

  if (isVoucher.value) {
    payload.code = form.code.trim()
    // Expire at the end of the chosen day so it stays valid all that day.
    payload.expiresAt = form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null
    payload.usageLimit = form.usageLimit || null
    // A voucher is never an auto-banner or internal comp.
    payload.displayAsBanner = false
    payload.internal = false
  } else {
    const details = detailsText.value
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
    payload.details = details.length ? details : null
    payload.displayAsBanner = form.displayAsBanner
    payload.internal = form.internal
    payload.code = null
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
    error.value = err?.message || 'Failed to save'
  } finally {
    loading.value = false
  }
}
</script>
