import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { EmailTemplate } from '@/types'

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<EmailTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      templates.value = await apiService.getTemplates()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch templates'
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(payload: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await apiService.createTemplate(payload)
    await fetchTemplates()
    return created
  }

  async function updateTemplate(id: string, payload: Partial<EmailTemplate>) {
    const updated = await apiService.updateTemplate(id, payload)
    await fetchTemplates()
    return updated
  }

  async function deleteTemplate(id: string) {
    await apiService.deleteTemplate(id)
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
})
