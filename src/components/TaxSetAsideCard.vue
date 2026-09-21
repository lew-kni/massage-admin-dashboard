<template>
  <div class="card p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">
          <i class="fas fa-piggy-bank text-sage-600 mr-1"></i>Estimated tax to set aside
        </p>
        <p class="text-xs text-gray-500 mt-0.5">{{ context }}</p>
      </div>
      <span class="text-xs text-gray-400 whitespace-nowrap">{{ TAX_YEAR_LABEL }} rates</span>
    </div>

    <!-- No profit yet / loss -->
    <template v-if="estimate.total === 0">
      <p class="text-3xl font-bold text-sage-600 mt-3">{{ gbp(0) }}</p>
      <p class="text-sm text-gray-500 mt-2">
        <template v-if="profit > 0">
          Profit so far is under the {{ gbp(PERSONAL_ALLOWANCE) }} tax-free personal allowance, so there's no
          Income Tax or National Insurance to set aside yet.
        </template>
        <template v-else-if="profit < 0">
          A loss this year — nothing to set aside. A loss can often be carried forward against future profits.
        </template>
        <template v-else>
          No taxable profit yet, so nothing to set aside.
        </template>
      </p>
    </template>

    <!-- Has a bill -->
    <template v-else>
      <p class="text-3xl font-bold text-sage-600 mt-3">{{ gbp(estimate.total) }}</p>
      <p class="text-sm text-gray-500 mt-1">
        ≈ <strong>{{ pct(estimate.effectiveRate) }}</strong> of your {{ gbp(profit) }} profit
      </p>

      <div class="mt-4 space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Income Tax</span>
          <span class="font-medium">{{ gbp(estimate.incomeTax) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Class 4 National Insurance</span>
          <span class="font-medium">{{ gbp(estimate.class4Nic) }}</span>
        </div>
      </div>
    </template>

    <p class="text-xs text-gray-400 mt-4 leading-relaxed">
      Rough guide only, assuming self-employment is your only income and no other reliefs — not a tax
      calculation or advice. Payments on account can make your first bill higher.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { estimateSelfEmployedTax, TAX_YEAR_LABEL, PERSONAL_ALLOWANCE } from '@/constants/incomeTax'

const props = defineProps<{
  /** Taxable profit in pounds (turnover minus allowable expenses). */
  profit: number
  /** Small descriptor under the heading, e.g. the tax year in view. */
  context: string
}>()

const estimate = computed(() => estimateSelfEmployedTax(props.profit))

const gbp = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (r: number) => (r * 100).toFixed(1) + '%'
</script>
