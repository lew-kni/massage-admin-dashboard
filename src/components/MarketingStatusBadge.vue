<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="cls"
  >
    <i :class="icon"></i>{{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MarketingConsentStatus } from '@/types'

// `null` = this person has never opted in (used on the client record, where the
// absence of a marketing row is meaningful). SUBSCRIBED / UNSUBSCRIBED come from
// an existing record.
const props = defineProps<{ status: MarketingConsentStatus | null }>()

const label = computed(() =>
  props.status === 'SUBSCRIBED' ? 'Subscribed'
  : props.status === 'UNSUBSCRIBED' ? 'Unsubscribed'
  : 'Not subscribed'
)

const icon = computed(() =>
  props.status === 'SUBSCRIBED' ? 'fas fa-circle-check'
  : props.status === 'UNSUBSCRIBED' ? 'fas fa-circle-xmark'
  : 'fas fa-minus'
)

const cls = computed(() =>
  props.status === 'SUBSCRIBED'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
)
</script>
