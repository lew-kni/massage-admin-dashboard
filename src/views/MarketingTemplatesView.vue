<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1>Templates</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Saved email designs. Pick one to preview it, then Use it to start a new send from a copy — the template itself stays untouched.
        Save a new template from the <RouterLink to="/marketing/send" class="text-sage-600 hover:underline">Send</RouterLink> page.
      </p>
    </div>

    <div v-if="store.loading && store.templates.length === 0" class="card p-8 text-center text-gray-500">Loading…</div>

    <div v-else-if="store.templates.length === 0" class="card p-8 text-center text-gray-500">
      <i class="fas fa-file-lines text-2xl mb-2"></i>
      <p>No templates yet. Build an email on the Send page and choose “Save as template”.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- List -->
      <div class="card lg:col-span-1">
        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="t in store.templates" :key="t.id">
            <button
              class="w-full text-left px-4 py-3 transition-colors"
              :class="t.id === selectedId
                ? 'bg-sage-50 dark:bg-gray-800 border-l-2 border-sage-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 border-l-2 border-transparent'"
              @click="selectedId = t.id"
            >
              <p class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ t.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ t.subject || 'No subject' }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ t.blocks.length }} block{{ t.blocks.length === 1 ? '' : 's' }} · {{ formatDate(t.updatedAt) }}</p>
            </button>
          </li>
        </ul>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="selected">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ selected.name }}</h2>
              <p v-if="selected.subject" class="text-sm text-gray-500">Subject: {{ selected.subject }}</p>
            </div>
            <div class="flex gap-2">
              <button class="btn-secondary text-sm text-red-600" @click="remove(selected)"><i class="fas fa-trash mr-1"></i>Delete</button>
              <button class="btn-primary text-sm" @click="use(selected)"><i class="fas fa-paper-plane mr-1"></i>Use</button>
            </div>
          </div>
          <MarketingEmailPreview :subject="selected.subject" :blocks="(selected.blocks as MarketingBlock[])" />
        </template>
        <div v-else class="card p-8 text-center text-gray-500">Select a template to preview it.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useMarketingStore } from '@/stores/marketing'
import type { MarketingTemplate } from '@/types'
import type { MarketingBlock } from '@/utils/marketingBlocks'
import MarketingEmailPreview from '@/components/MarketingEmailPreview.vue'

const store = useMarketingStore()
const router = useRouter()

const selectedId = ref<string | null>(null)
const selected = computed(() => store.templates.find((t) => t.id === selectedId.value) || null)

// Keep a valid selection: default to the first, and re-point if the current one
// is deleted.
watch(
  () => store.templates,
  (list) => {
    if (!list.some((t) => t.id === selectedId.value)) {
      selectedId.value = list[0]?.id ?? null
    }
  },
  { immediate: true }
)

function use(t: MarketingTemplate) {
  store.useTemplate(t)
  router.push('/marketing/send')
}

async function remove(t: MarketingTemplate) {
  if (!confirm(`Delete template “${t.name}”?`)) return
  await store.deleteTemplate(t.id)
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

onMounted(() => {
  store.fetchTemplates()
})
</script>
