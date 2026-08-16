<template>
  <div class="p-8 dark:text-gray-50">
    <div class="flex justify-between items-center mb-6">
      <RouterLink to="/settings/services?tab=promotions" class="text-sage-600 hover:text-sage-700 dark:text-sage-400">
        <i class="fas fa-arrow-left mr-1"></i>Back to Promotions
      </RouterLink>
      <button v-if="id" @click="onDelete" :disabled="saving" class="btn-danger text-sm">
        <i class="fas fa-trash-alt mr-1"></i>Delete
      </button>
    </div>

    <h1 class="text-2xl font-bold mb-6">{{ title }}</h1>

    <div v-if="loading" class="text-gray-500">Loading…</div>

    <form v-else @submit.prevent="save" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Basics -->
        <div class="card">
          <div class="card-header"><h2 class="text-lg font-semibold">Details</h2></div>
          <div class="card-body space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <div class="grid grid-cols-2 gap-2 max-w-sm">
                <button v-for="opt in kindOptions" :key="opt.value" type="button" @click="form.kind = opt.value"
                  :class="['px-3 py-2 rounded border text-sm font-medium', form.kind === opt.value ? 'border-sage-500 bg-sage-50 dark:bg-gray-800 text-sage-700 dark:text-sage-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400']">
                  <i class="fas mr-1" :class="opt.icon"></i>{{ opt.label }}
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ isVoucher ? 'Redeemed with a code the customer types in — never advertised.' : 'Applied automatically to matching bookings, and shown on the site.' }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ isVoucher ? 'Text shown once applied' : 'Message' }} <span class="text-red-600">*</span></label>
              <input v-model="form.message" type="text" class="input-field" required :placeholder="isVoucher ? 'e.g. £10 off — welcome back!' : 'e.g. 50% off Sports Massage sessions!'" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount <span class="text-red-600">*</span></label>
              <div class="flex gap-2 max-w-sm">
                <div class="inline-flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button type="button" @click="form.discountType = 'PERCENT'" :class="['px-3 py-2 text-sm font-medium', form.discountType === 'PERCENT' ? 'bg-sage-500 text-white' : 'text-gray-600 dark:text-gray-400']">%</button>
                  <button type="button" @click="form.discountType = 'FIXED'" :class="['px-3 py-2 text-sm font-medium', form.discountType === 'FIXED' ? 'bg-sage-500 text-white' : 'text-gray-600 dark:text-gray-400']">£</button>
                </div>
                <div class="relative flex-1">
                  <span v-if="form.discountType === 'FIXED'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                  <input v-model.number="form.value" type="number" min="0" :max="form.discountType === 'PERCENT' ? 100 : undefined" class="input-field" :class="{ 'pl-7': form.discountType === 'FIXED' }" required />
                  <span v-if="form.discountType === 'PERCENT'" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
              </div>
            </div>

            <label class="flex items-start gap-2 text-sm pt-2 border-t dark:border-gray-700">
              <input v-model="form.firstBookingOnly" type="checkbox" class="w-4 h-4 mt-0.5" />
              <span>
                First booking only
                <span class="block text-xs text-gray-500 font-normal">Only applies to a client with no previous confirmed booking (matched by email or phone). Ideal for a "£10 off your first booking" flyer.</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Scope -->
        <div class="card">
          <div class="card-header"><h2 class="text-lg font-semibold">Applies to</h2></div>
          <div class="card-body space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm"><input type="radio" value="all" v-model="scope" /> All services</label>
                <label class="flex items-center gap-2 text-sm"><input type="radio" value="specific" v-model="scope" /> Specific services</label>
              </div>
              <div v-if="scope === 'specific'" class="mt-2 pl-6 space-y-1">
                <label v-for="s in store.services" :key="s.id" class="flex items-center gap-2 text-sm"><input type="checkbox" :value="s.slug" v-model="selectedSlugs" /> {{ s.name }}</label>
                <p v-if="store.services.length === 0" class="text-xs text-gray-400">No services available</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durations</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm"><input type="radio" value="all" v-model="durationScope" /> All durations</label>
                <label class="flex items-center gap-2 text-sm"><input type="radio" value="specific" v-model="durationScope" /> Specific durations</label>
              </div>
              <div v-if="durationScope === 'specific'" class="mt-2 pl-6 flex flex-wrap gap-3">
                <label v-for="m in allDurations" :key="m" class="flex items-center gap-2 text-sm"><input type="checkbox" :value="m" v-model="selectedMinutes" /> {{ m }} min</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Promotion-only: banner + more info -->
        <div v-if="!isVoucher" class="card">
          <div class="card-header"><h2 class="text-lg font-semibold">Display</h2></div>
          <div class="card-body space-y-4">
            <label class="flex items-start gap-2 text-sm">
              <input v-model="form.displayAsBanner" type="checkbox" class="w-4 h-4 mt-0.5" />
              <span>Display as banner sitewide<span class="block text-xs text-gray-500 font-normal">Shows this promotion in the banner across the brochure. Needs "Active" too.</span></span>
            </label>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">"More info" modal content <span class="text-gray-400 font-normal">(optional)</span></label>
              <textarea v-model="detailsText" rows="4" class="input-field" placeholder="Extra detail shown when a visitor clicks &quot;More info&quot;. Separate paragraphs with a blank line."></textarea>
            </div>
            <label class="flex items-start gap-2 text-sm">
              <input v-model="form.internal" type="checkbox" class="w-4 h-4 mt-0.5" />
              <span>Internal only<span class="block text-xs text-gray-500 font-normal">Never shown on the website — for one-off discounts you apply yourself. Still needs "Active".</span></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Sidebar: status, voucher settings, codes -->
      <div class="space-y-6">
        <div class="card">
          <div class="card-header"><h2 class="text-lg font-semibold">Status</h2></div>
          <div class="card-body space-y-3">
            <label class="flex items-center gap-2 text-sm"><input v-model="form.active" type="checkbox" class="w-4 h-4" /> Active (usable for pricing)</label>
            <template v-if="isVoucher">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires <span class="text-gray-400 font-normal">(optional)</span></label>
                <input v-model="form.expiresAt" type="date" class="input-field" />
              </div>
            </template>
            <div v-if="error" class="p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded"><p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p></div>
            <button type="submit" :disabled="saving" class="btn-primary w-full text-sm">{{ saving ? 'Saving…' : (id ? 'Save changes' : 'Create') }}</button>
          </div>
        </div>

        <!-- Codes (vouchers, once created) -->
        <div v-if="isVoucher" class="card">
          <div class="card-header"><h2 class="text-lg font-semibold"><i class="fas fa-ticket mr-2"></i>Codes</h2></div>
          <div class="card-body">
            <p v-if="!id" class="text-sm text-gray-500">Save the voucher first, then add its codes here.</p>
            <template v-else>
              <p class="text-xs text-gray-500 mb-3">Add one code per area/flyer (e.g. <span class="font-medium">NPMNEWMILLS</span>). All share this voucher's offer; the usage count shows how many bookings quoted each — your flyer attribution.</p>
              <div v-if="codes.length" class="space-y-2 mb-4">
                <div v-for="c in codes" :key="c.id" class="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 pb-2">
                  <div>
                    <span class="font-medium uppercase">{{ c.code }}</span>
                    <span v-if="c.label" class="text-gray-500"> · {{ c.label }}</span>
                    <span class="block text-xs text-gray-400">used {{ c.usageCount }}{{ c.usageLimit ? ` / ${c.usageLimit}` : '' }}</span>
                  </div>
                  <button @click="removeCode(c)" :disabled="codeSaving" class="text-red-500 hover:text-red-700 text-xs" title="Delete code"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400 mb-4">No codes yet.</p>

              <div class="space-y-2 border-t dark:border-gray-700 pt-3">
                <input v-model="newCode.code" type="text" class="input-field uppercase text-sm" placeholder="Code e.g. NPMBUXTON" />
                <input v-model="newCode.label" type="text" class="input-field text-sm" placeholder="Label (optional) e.g. Buxton flyer" />
                <input v-model.number="newCode.usageLimit" type="number" min="1" class="input-field text-sm" placeholder="Usage cap (optional)" />
                <button @click="addCode" :disabled="codeSaving || !newCode.code.trim()" class="btn-secondary w-full text-sm">Add code</button>
                <p v-if="codeError" class="text-sm text-red-600">{{ codeError }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useServicesStore } from '@/stores/services'
import { apiService } from '@/services/api'
import type { Promotion, PromotionKind, PromoCode } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useServicesStore()

const id = ref(route.params.id === 'new' ? '' : (route.params.id as string))
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const kindOptions = [
  { value: 'PROMOTION' as const, label: 'Promotion', icon: 'fa-tag' },
  { value: 'VOUCHER' as const, label: 'Voucher', icon: 'fa-ticket' },
]

const scope = ref<'all' | 'specific'>('all')
const selectedSlugs = ref<string[]>([])
const durationScope = ref<'all' | 'specific'>('all')
const selectedMinutes = ref<number[]>([])
const detailsText = ref('')

const allDurations = computed(() => {
  const set = new Set<number>()
  store.services.forEach((s) => s.durations?.forEach((d) => set.add(d.minutes)))
  return [...set].sort((a, b) => a - b)
})

const form = reactive({
  kind: ((route.query.kind as PromotionKind) || 'PROMOTION') as PromotionKind,
  message: '',
  discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
  value: 0,
  active: false,
  internal: false,
  displayAsBanner: false,
  firstBookingOnly: false,
  expiresAt: '',
})

const codes = ref<PromoCode[]>([])
const newCode = reactive({ code: '', label: '', usageLimit: null as number | null })
const codeSaving = ref(false)
const codeError = ref('')

const isVoucher = computed(() => form.kind === 'VOUCHER')
const title = computed(() => {
  const noun = isVoucher.value ? 'Voucher' : 'Promotion'
  return id.value ? `Edit ${noun}` : `New ${noun}`
})

function hydrate(p: Promotion) {
  form.kind = p.kind
  form.message = p.message
  form.discountType = p.discountType
  form.value = p.discountType === 'FIXED' ? (p.discountAmount ?? 0) : p.discountPercentage
  form.active = p.active
  form.internal = p.internal
  form.displayAsBanner = p.displayAsBanner
  form.firstBookingOnly = p.firstBookingOnly ?? false
  form.expiresAt = p.expiresAt ? p.expiresAt.slice(0, 10) : ''
  scope.value = Array.isArray(p.applicableTo) ? 'specific' : 'all'
  selectedSlugs.value = Array.isArray(p.applicableTo) ? [...p.applicableTo] : []
  durationScope.value = Array.isArray(p.applicableDurations) ? 'specific' : 'all'
  selectedMinutes.value = Array.isArray(p.applicableDurations) ? [...p.applicableDurations] : []
  detailsText.value = p.details?.join('\n\n') || ''
  codes.value = p.promoCodes || []
}

onMounted(async () => {
  if (store.services.length === 0) await store.fetchServices()
  if (id.value) {
    try {
      hydrate(await apiService.getPromotion(id.value))
    } catch (err: any) {
      error.value = err?.message || 'Failed to load'
    }
  }
  loading.value = false
})

async function save() {
  if (!form.message.trim()) { error.value = 'Message is required'; return }
  if (!(form.value >= 0) || (form.discountType === 'PERCENT' && form.value > 100)) { error.value = 'Enter a valid discount'; return }
  if (scope.value === 'specific' && selectedSlugs.value.length === 0) { error.value = 'Pick at least one service, or choose All'; return }
  if (durationScope.value === 'specific' && selectedMinutes.value.length === 0) { error.value = 'Pick at least one duration, or choose All'; return }

  const payload: Partial<Promotion> = {
    kind: form.kind,
    message: form.message.trim(),
    discountType: form.discountType,
    discountPercentage: form.discountType === 'PERCENT' ? form.value : 0,
    discountAmount: form.discountType === 'FIXED' ? form.value : null,
    active: form.active,
    firstBookingOnly: form.firstBookingOnly,
    applicableTo: scope.value === 'all' ? 'all' : selectedSlugs.value,
    applicableDurations: durationScope.value === 'all' ? 'all' : selectedMinutes.value,
  }
  if (isVoucher.value) {
    payload.expiresAt = form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null
    payload.displayAsBanner = false
    payload.internal = false
    payload.code = null
  } else {
    const details = detailsText.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    payload.details = details.length ? details : null
    payload.displayAsBanner = form.displayAsBanner
    payload.internal = form.internal
    payload.code = null
  }

  saving.value = true
  error.value = ''
  try {
    if (id.value) {
      await store.updatePromotion(id.value, payload)
    } else {
      const created = await store.createPromotion(payload)
      // Move to the saved promotion's page so codes can be added.
      router.replace(`/settings/services/promotions/${created.id}`)
      id.value = created.id
      hydrate(created as Promotion)
    }
  } catch (err: any) {
    error.value = err?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function addCode() {
  if (!newCode.code.trim()) return
  codeSaving.value = true
  codeError.value = ''
  try {
    await apiService.addPromoCode(id.value, {
      code: newCode.code.trim(),
      label: newCode.label.trim() || null,
      usageLimit: newCode.usageLimit || null,
    })
    hydrate(await apiService.getPromotion(id.value))
    newCode.code = ''
    newCode.label = ''
    newCode.usageLimit = null
  } catch (err: any) {
    codeError.value = err?.response?.data?.error || err?.message || 'Failed to add code'
  } finally {
    codeSaving.value = false
  }
}

async function removeCode(c: PromoCode) {
  if (!confirm(`Delete code ${c.code}?`)) return
  codeSaving.value = true
  codeError.value = ''
  try {
    await apiService.deletePromoCode(id.value, c.id)
    codes.value = codes.value.filter((x) => x.id !== c.id)
  } catch (err: any) {
    codeError.value = err?.message || 'Failed to delete code'
  } finally {
    codeSaving.value = false
  }
}

async function onDelete() {
  if (!id.value) return
  if (!confirm('Delete this promotion? This cannot be undone.')) return
  saving.value = true
  try {
    await store.deletePromotion(id.value)
    router.push('/settings/services?tab=promotions')
  } catch (err: any) {
    error.value = err?.message || 'Failed to delete'
    saving.value = false
  }
}
</script>
