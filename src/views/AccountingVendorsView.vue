<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Vendors</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">The suppliers you buy from. Pick one when logging an expense or receipt, and see everything tied to it in one place.</p>
      </div>
      <button @click="openCreate" class="btn-primary text-sm">
        <i class="fas fa-plus mr-1"></i>Add vendor
      </button>
    </div>

    <div v-if="store.loading && store.vendors.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <div v-else-if="store.vendors.length === 0" class="card p-8 text-center text-gray-500">
      <i class="fas fa-store text-2xl mb-2"></i>
      <p>No vendors yet. Add one, or create one on the fly when logging an expense.</p>
    </div>

    <div v-else class="card">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                <th class="px-3 py-2 font-semibold">Vendor</th>
                <th class="px-3 py-2 font-semibold">Default category</th>
                <th class="px-3 py-2 font-semibold text-right">Expenses</th>
                <th class="px-3 py-2 font-semibold text-right">Receipts</th>
                <th class="px-3 py-2 font-semibold text-right">Total spent</th>
                <th class="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in pagedVendors" :key="v.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                <td class="px-3 py-2">
                  <RouterLink :to="`/accounting/vendors/${v.id}`" class="text-sage-600 hover:text-sage-700 font-medium">{{ v.name }}</RouterLink>
                </td>
                <td class="px-3 py-2">
                  <span v-if="v.defaultCategory" class="badge bg-sage-100 text-sage-800">{{ categoryLabel(v.defaultCategory) }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ v.expenseCount }}</td>
                <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ v.receiptCount }}</td>
                <td class="px-3 py-2 text-right font-medium">{{ gbp(v.totalSpent / 100) }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap">
                  <button @click="openEdit(v)" class="text-gray-400 hover:text-sage-600 mr-3"><i class="fas fa-pen"></i></button>
                  <button @click="confirmDelete(v)" class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-model="vendorsPage" :total-pages="totalVendorPages" />
        <p v-if="store.error" class="mt-3 text-sm text-red-700">{{ store.error }}</p>
      </div>
    </div>

    <VendorFormModal
      v-if="showForm"
      :vendor="editingVendor ?? undefined"
      @close="showForm = false"
      @saved="showForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useVendorsStore } from '@/stores/vendors'
import { categoryLabel } from '@/constants/expenseCategories'
import type { Vendor } from '@/types'
import VendorFormModal from '@/components/VendorFormModal.vue'
import Pagination from '@/components/Pagination.vue'

const store = useVendorsStore()
const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PAGE_SIZE = 10
const vendorsPage = ref(1)
const totalVendorPages = computed(() => Math.max(1, Math.ceil(store.vendors.length / PAGE_SIZE)))
const pagedVendors = computed(() =>
  store.vendors.slice((vendorsPage.value - 1) * PAGE_SIZE, vendorsPage.value * PAGE_SIZE)
)
watch(totalVendorPages, (tp) => { if (vendorsPage.value > tp) vendorsPage.value = tp })

const showForm = ref(false)
const editingVendor = ref<Vendor | null>(null)

function openCreate() {
  editingVendor.value = null
  showForm.value = true
}
function openEdit(v: Vendor) {
  editingVendor.value = v
  showForm.value = true
}
async function confirmDelete(v: Vendor) {
  const tied = v.expenseCount + v.receiptCount
  const warning = tied
    ? ` Its ${v.expenseCount} expense${v.expenseCount === 1 ? '' : 's'} and ${v.receiptCount} receipt${v.receiptCount === 1 ? '' : 's'} are kept, just unlinked.`
    : ''
  if (!confirm(`Delete vendor "${v.name}"?${warning}`)) return
  await store.deleteVendor(v.id)
}

onMounted(() => {
  store.fetchVendors()
})
</script>
