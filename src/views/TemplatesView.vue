<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8 flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Email Templates</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Reusable templates used when sending emails to clients</p>
      </div>
      <button @click="newTemplate" class="btn-primary text-sm">
        <i class="fas fa-plus"></i>
        <span>New Template</span>
      </button>
    </div>

    <div v-if="store.loading && store.templates.length === 0" class="text-center py-12 text-gray-500">
      Loading templates...
    </div>

    <div v-else-if="store.templates.length === 0" class="card p-12 text-center text-gray-500">
      No templates yet. Create your first one.
    </div>

    <div v-else class="space-y-4">
      <div v-for="t in store.templates" :key="t.id" class="card">
        <div class="card-body flex justify-between items-start">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold">{{ prettyName(t.name) }}</h3>
              <span class="badge bg-gray-100 text-gray-700">{{ t.type }}</span>
            </div>
            <p class="text-sm text-gray-500 mt-1 truncate">{{ t.subject }}</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="editTemplate(t)" class="btn-secondary text-sm">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button @click="confirmDelete(t)" class="btn-danger text-sm">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <TemplateFormModal
      v-if="showModal"
      :template="editingTemplate || undefined"
      @close="showModal = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTemplatesStore } from '@/stores/templates'
import type { EmailTemplate } from '@/types'
import TemplateFormModal from '@/components/TemplateFormModal.vue'

const store = useTemplatesStore()
const showModal = ref(false)
const editingTemplate = ref<EmailTemplate | null>(null)

function prettyName(name: string) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function newTemplate() {
  editingTemplate.value = null
  showModal.value = true
}

function editTemplate(t: EmailTemplate) {
  editingTemplate.value = t
  showModal.value = true
}

async function confirmDelete(t: EmailTemplate) {
  if (confirm(`Delete the "${prettyName(t.name)}" template? This can't be undone.`)) {
    await store.deleteTemplate(t.id)
  }
}

function onSaved() {
  // Store refetches internally; nothing else needed here
}

onMounted(() => {
  store.fetchTemplates()
})
</script>
