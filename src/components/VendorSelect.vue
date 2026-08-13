<template>
  <div class="relative">
    <input
      ref="inputEl"
      v-model="query"
      type="text"
      class="input-field"
      :placeholder="placeholder"
      autocomplete="off"
      @focus="open = true"
      @input="onInput"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="chooseHighlighted"
      @keydown.esc="open = false"
      @blur="onBlur"
    />
    <!-- Clear the current selection -->
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      title="Clear vendor"
      @mousedown.prevent="clear"
    >
      <i class="fas fa-xmark"></i>
    </button>

    <ul
      v-if="open && (filtered.length || canCreate)"
      class="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-56 overflow-y-auto"
    >
      <li
        v-for="(v, i) in filtered"
        :key="v.id"
        :class="['px-3 py-2 text-sm cursor-pointer flex justify-between', i === highlight ? 'bg-sage-50' : 'hover:bg-sage-50']"
        @mousedown.prevent="select(v)"
        @mouseenter="highlight = i"
      >
        <span>{{ v.name }}</span>
        <span v-if="v.expenseCount || v.receiptCount" class="text-gray-400 text-xs">
          {{ v.expenseCount }} exp · {{ v.receiptCount }} rec
        </span>
      </li>
      <li
        v-if="canCreate"
        :class="['px-3 py-2 text-sm cursor-pointer text-sage-700', highlight === filtered.length ? 'bg-sage-50' : 'hover:bg-sage-50']"
        @mousedown.prevent="createFromQuery"
        @mouseenter="highlight = filtered.length"
      >
        <i class="fas fa-plus mr-1"></i>Add "{{ query.trim() }}"
      </li>
    </ul>
    <p v-if="createError" class="text-xs text-red-600 mt-1">{{ createError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useVendorsStore } from '@/stores/vendors'
import type { Vendor } from '@/types'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
  }>(),
  { modelValue: null, placeholder: 'Search or add a vendor…' }
)
const emit = defineEmits<{
  'update:modelValue': [string | null]
  // Full vendor when one is chosen (or null when cleared) — lets a parent
  // pre-fill things like the default expense category.
  'vendor-selected': [Vendor | null]
}>()

const store = useVendorsStore()
const query = ref('')
const open = ref(false)
const highlight = ref(0)
const createError = ref('')

// Keep the input text in sync with the bound id (e.g. edit mode loading an
// existing expense, or the id being set externally).
function syncQueryFromModel() {
  if (!props.modelValue) return
  const match = store.vendors.find((v) => v.id === props.modelValue)
  if (match) query.value = match.name
}

onMounted(async () => {
  if (store.vendors.length === 0) await store.fetchVendors()
  syncQueryFromModel()
})
watch(() => props.modelValue, syncQueryFromModel)
watch(() => store.vendors.length, syncQueryFromModel)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = q ? store.vendors.filter((v) => v.name.toLowerCase().includes(q)) : store.vendors
  return list.slice(0, 20)
})

// Only offer to create when the typed name doesn't already exist (case-insensitive).
const canCreate = computed(() => {
  const q = query.value.trim()
  if (!q) return false
  return !store.vendors.some((v) => v.name.toLowerCase() === q.toLowerCase())
})

function onInput() {
  open.value = true
  highlight.value = 0
  createError.value = ''
  // Typing a fresh name detaches any current selection until they pick again.
  if (props.modelValue) {
    emit('update:modelValue', null)
    emit('vendor-selected', null)
  }
}

function move(delta: number) {
  open.value = true
  const max = filtered.value.length + (canCreate.value ? 1 : 0) - 1
  if (max < 0) return
  highlight.value = Math.min(Math.max(0, highlight.value + delta), max)
}

function chooseHighlighted() {
  if (highlight.value < filtered.value.length) {
    select(filtered.value[highlight.value])
  } else if (canCreate.value) {
    createFromQuery()
  }
}

function select(v: Vendor) {
  query.value = v.name
  open.value = false
  emit('update:modelValue', v.id)
  emit('vendor-selected', v)
}

function clear() {
  query.value = ''
  open.value = false
  emit('update:modelValue', null)
  emit('vendor-selected', null)
}

async function createFromQuery() {
  const name = query.value.trim()
  if (!name) return
  createError.value = ''
  try {
    const created = await store.createVendor({ name })
    // fetchVendors ran inside the store, so it's now in the list.
    select(created as Vendor)
  } catch (err: any) {
    createError.value = err?.response?.data?.error || err?.message || 'Could not add vendor'
  }
}

function onBlur() {
  // Delay so a mousedown on an option still registers before the list closes.
  setTimeout(() => {
    open.value = false
    // If they typed but didn't pick/create, restore the selected vendor's name
    // (or clear the text if nothing is selected).
    if (props.modelValue) {
      syncQueryFromModel()
    } else if (query.value && !store.vendors.some((v) => v.name.toLowerCase() === query.value.trim().toLowerCase())) {
      query.value = ''
    }
  }, 150)
}
</script>
