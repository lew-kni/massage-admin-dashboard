<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
        <h2 class="text-lg font-semibold">{{ template ? 'Edit Template' : 'New Template' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Form fields -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                v-model="form.name"
                type="text"
                class="input-field"
                required
                :disabled="!!template"
                placeholder="e.g. Booking Reminder"
              />
              <p v-if="!template" class="text-xs text-gray-400 mt-1">Stored as a lowercase, underscored key.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select v-model="form.type" class="input-field" required>
                <option value="WELCOME">Welcome</option>
                <option value="REMINDER_24H">Reminder (24h)</option>
                <option value="CONFIRMATION">Confirmation</option>
                <option value="CANCELLATION">Cancellation</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <input v-model="form.subject" type="text" class="input-field" required placeholder="Email subject" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea v-model="bodyText" rows="14" class="input-field font-normal" placeholder="Write the template body..."></textarea>
            <p class="text-xs text-gray-400 mt-1" v-pre>
              Use <code>{{ variableName }}</code> for placeholders (e.g. <code>{{ firstName }}</code>,
              <code>{{ date }}</code>, <code>{{ time }}</code>, <code>{{ location }}</code>). Blank lines start a new paragraph.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variable names <span class="text-gray-400 font-normal">(optional, comma-separated)</span>
            </label>
            <input v-model="variablesText" type="text" class="input-field" placeholder="firstName, date, time, location" />
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
            <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn-primary">
              <span v-if="loading">Saving...</span>
              <template v-else-if="template"><i class="fas fa-check"></i><span>Save</span></template>
              <template v-else><i class="fas fa-plus"></i><span>Create</span></template>
            </button>
          </div>
        </div>

        <!-- Live preview -->
        <div class="lg:border-l lg:pl-6 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live preview</p>
          <EmailPreview :subject="previewSubject" :body-html="previewBodyHtml" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useTemplatesStore } from '@/stores/templates'
import type { EmailTemplate } from '@/types'
import EmailPreview from '@/components/EmailPreview.vue'
import { htmlToText, textToHtml, fillPreviewVars } from '@/utils/emailPreview'

const props = defineProps<{ template?: EmailTemplate }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useTemplatesStore()
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: props.template?.name || '',
  type: props.template?.type || 'CUSTOM',
  subject: props.template?.subject || '',
})

const bodyText = ref(props.template ? htmlToText(props.template.body) : '')
const variablesText = ref(props.template?.variables?.join(', ') || '')

const previewSubject = computed(() => fillPreviewVars(form.subject))
const previewBodyHtml = computed(() => fillPreviewVars(textToHtml(bodyText.value)))

async function submitForm() {
  if (!form.name.trim() || !form.subject.trim() || !bodyText.value.trim()) {
    error.value = 'Name, subject and message are all required'
    return
  }

  const variables = variablesText.value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const payload: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: form.name.trim(),
    type: form.type as EmailTemplate['type'],
    subject: form.subject.trim(),
    body: textToHtml(bodyText.value),
    variables: variables.length ? variables : null,
  }

  loading.value = true
  error.value = ''
  try {
    if (props.template) {
      await store.updateTemplate(props.template.id, payload)
    } else {
      await store.createTemplate(payload)
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to save template'
  } finally {
    loading.value = false
  }
}
</script>
