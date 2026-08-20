<template>
  <div>
    <p class="text-sm text-gray-500 mb-4">
      Control which emails send automatically. Changes save as you make them.
      Owner notifications (new enquiry, new booking request) always send and
      aren't listed here.
    </p>

    <div v-if="loading" class="card p-8 text-center text-gray-500">Loading triggers...</div>

    <div v-else-if="error" class="card p-6 text-center text-red-600">{{ error }}</div>

    <div v-else class="space-y-3">
      <div v-for="t in triggers" :key="t.key" class="card">
        <div class="card-body">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold">{{ t.label }}</h3>
                <span
                  class="badge text-xs"
                  :class="t.timing === 'scheduled' ? 'bg-sage-100 text-sage-800' : 'bg-gray-100 text-gray-700'"
                >
                  <i :class="t.timing === 'scheduled' ? 'fas fa-clock' : 'fas fa-bolt'" class="mr-1"></i>
                  {{ t.timing === 'scheduled' ? 'Scheduled' : 'On event' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t.description }}</p>
            </div>

            <!-- Enable toggle -->
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="t.enabled"
                @change="onToggle(t)"
              />
              <div
                class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-sage-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
              ></div>
            </label>
          </div>

          <!-- Per-trigger config -->
          <div
            v-if="t.enabled && (t.templateEditable || t.supportsOffset)"
            class="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div v-if="t.templateEditable">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
              <select
                class="input-field"
                :value="t.templateName || ''"
                @change="onTemplateChange(t, $event)"
              >
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.name">
                  {{ prettyName(tpl.name) }}
                </option>
              </select>
            </div>
            <div v-else-if="t.templateName === null" class="text-sm text-gray-400 self-end pb-2">
              <i class="fas fa-lock mr-1"></i>Built-in message
            </div>

            <div v-if="t.supportsOffset">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Send this many hours {{ t.offsetDirection === 'after' ? 'after' : 'before' }} the appointment
              </label>
              <input
                type="number"
                min="1"
                class="input-field"
                :value="offsetHours(t)"
                @change="onOffsetChange(t, $event)"
              />
            </div>
          </div>

          <p v-if="savedKey === t.key" class="text-xs text-green-600 mt-2">
            <i class="fas fa-check mr-1"></i>Saved
          </p>
          <p v-if="rowError[t.key]" class="text-xs text-red-600 mt-2">
            <i class="fas fa-triangle-exclamation mr-1"></i>{{ rowError[t.key] }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '@/services/api'
import type { EmailTrigger, EmailTemplate } from '@/types'

const triggers = ref<EmailTrigger[]>([])
const templates = ref<EmailTemplate[]>([])
const loading = ref(true)
const error = ref('')
const savedKey = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function prettyName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function offsetHours(t: EmailTrigger) {
  return t.offsetMinutes ? Math.round(t.offsetMinutes / 60) : 24
}

function flashSaved(key: string) {
  savedKey.value = key
  setTimeout(() => {
    if (savedKey.value === key) savedKey.value = null
  }, 2000)
}

async function save(t: EmailTrigger, payload: Partial<Pick<EmailTrigger, 'enabled' | 'templateName' | 'offsetMinutes'>>) {
  rowError.value = { ...rowError.value, [t.key]: '' }
  try {
    const updated = await apiService.updateEmailTrigger(t.key, payload)
    // Merge server response back into the local row (keeps catalogue metadata).
    const i = triggers.value.findIndex((x) => x.key === t.key)
    if (i !== -1) triggers.value[i] = { ...triggers.value[i], ...updated }
    flashSaved(t.key)
  } catch (err: any) {
    rowError.value = {
      ...rowError.value,
      [t.key]: err?.response?.data?.error || err?.message || 'Failed to save',
    }
  }
}

function onToggle(t: EmailTrigger) {
  save(t, { enabled: !t.enabled })
}

function onTemplateChange(t: EmailTrigger, e: Event) {
  save(t, { templateName: (e.target as HTMLSelectElement).value })
}

function onOffsetChange(t: EmailTrigger, e: Event) {
  const hours = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(hours) || hours < 1) return
  save(t, { offsetMinutes: Math.round(hours * 60) })
}

onMounted(async () => {
  try {
    const [t, tpl] = await Promise.all([apiService.getEmailTriggers(), apiService.getTemplates()])
    triggers.value = t
    templates.value = tpl
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to load triggers'
  } finally {
    loading.value = false
  }
})
</script>
