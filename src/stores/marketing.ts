import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { MarketingContact, MarketingCampaign, MarketingSendResult, MarketingTemplate } from '@/types'
import type { MarketingBlock } from '@/utils/marketingBlocks'

export type MarketingFilter = 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'all'

export interface ComposerDraft {
  subject: string
  blocks: MarketingBlock[]
}

export const useMarketingStore = defineStore('marketing', () => {
  const contacts = ref<MarketingContact[]>([])
  // Total currently-subscribed, independent of the active filter — so the header
  // can always show the real list size even while viewing unsubscribed contacts.
  const subscribedCount = ref(0)
  const campaigns = ref<MarketingCampaign[]>([])
  const templates = ref<MarketingTemplate[]>([])
  // Set when a template is "used" from the Templates page; the Send composer
  // consumes it on mount and clears it, so the layout is prefilled ready to send.
  const draft = ref<ComposerDraft | null>(null)
  const loading = ref(false)
  const sending = ref(false)
  const error = ref<string | null>(null)

  async function fetchContacts(status: MarketingFilter = 'SUBSCRIBED') {
    loading.value = true
    error.value = null
    try {
      const res = await apiService.getMarketingContacts(status)
      contacts.value = res.contacts
      subscribedCount.value = res.subscribedCount
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load marketing contacts'
    } finally {
      loading.value = false
    }
  }

  async function fetchCampaigns() {
    try {
      campaigns.value = await apiService.getMarketingCampaigns()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load campaigns'
    }
  }

  // Sends the campaign (rich HTML). Throws on failure so the caller can surface
  // the message; refreshes the subscribed count and campaign history on success.
  async function send(subject: string, html: string): Promise<MarketingSendResult> {
    sending.value = true
    try {
      const result = await apiService.sendMarketingCampaign(subject, html)
      await fetchCampaigns()
      return result
    } finally {
      sending.value = false
    }
  }

  async function fetchTemplates() {
    try {
      templates.value = await apiService.getMarketingTemplates()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load templates'
    }
  }

  async function saveTemplate(name: string, subject: string, blocks: MarketingBlock[]) {
    const created = await apiService.createMarketingTemplate(name, subject, blocks)
    await fetchTemplates()
    return created
  }

  async function updateTemplate(id: string, patch: { name?: string; subject?: string; blocks?: MarketingBlock[] }) {
    const updated = await apiService.updateMarketingTemplate(id, patch)
    await fetchTemplates()
    return updated
  }

  async function deleteTemplate(id: string) {
    await apiService.deleteMarketingTemplate(id)
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  async function uploadImage(file: File): Promise<string> {
    const { url } = await apiService.uploadMarketingImage(file)
    return url
  }

  // Prime the Send composer with a copy of a template, then navigate there.
  function useTemplate(t: MarketingTemplate) {
    draft.value = { subject: t.subject, blocks: JSON.parse(JSON.stringify(t.blocks)) as MarketingBlock[] }
  }

  function takeDraft(): ComposerDraft | null {
    const d = draft.value
    draft.value = null
    return d
  }

  // Keeps the subscribed count fresh without disturbing the currently-shown list
  // (e.g. when the Send tab needs the count but the list is filtered).
  async function refreshSubscribedCount() {
    try {
      const res = await apiService.getMarketingContacts('SUBSCRIBED')
      subscribedCount.value = res.subscribedCount
    } catch {
      // Non-fatal — the count just stays as last known.
    }
  }

  return {
    contacts,
    subscribedCount,
    campaigns,
    templates,
    draft,
    loading,
    sending,
    error,
    fetchContacts,
    fetchCampaigns,
    send,
    refreshSubscribedCount,
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    uploadImage,
    useTemplate,
    takeDraft,
  }
})
