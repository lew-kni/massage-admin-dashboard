<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Editor -->
    <div class="lg:col-span-2 space-y-4">
      <!-- Subject + template actions -->
      <div class="card">
        <div class="card-body space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1" for="mk-subject">Subject</label>
            <input id="mk-subject" v-model="subject" type="text" maxlength="200" class="input-field w-full"
              placeholder="e.g. A little autumn treat from North Peak Massage" />
          </div>
          <div class="flex justify-end">
            <button class="btn-secondary text-sm" :disabled="blocks.length === 0" @click="openSave">
              <i class="fas fa-floppy-disk mr-1"></i>Save as template
            </button>
          </div>
        </div>
      </div>

      <!-- Palette -->
      <div class="card">
        <div class="card-body">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Add a block</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="t in palette" :key="t" class="btn-secondary text-xs" @click="addBlock(t)">
              <i :class="BLOCK_ICONS[t]" class="mr-1"></i>{{ BLOCK_LABELS[t] }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="uploadError" class="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {{ uploadError }}
      </div>

      <!-- Empty -->
      <div v-if="blocks.length === 0" class="card p-8 text-center text-gray-500">
        <i class="fas fa-cubes text-2xl mb-2"></i>
        <p>Add blocks above to build your email.</p>
      </div>

      <!-- Blocks -->
      <div v-for="(block, i) in blocks" :key="block.id" class="card">
        <div class="card-body">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              <i :class="BLOCK_ICONS[block.type]" class="mr-1"></i>{{ BLOCK_LABELS[block.type] }}
            </span>
            <div class="flex items-center gap-1">
              <button class="icon-btn" :disabled="i === 0" @click="move(i, -1)" aria-label="Move up"><i class="fas fa-arrow-up"></i></button>
              <button class="icon-btn" :disabled="i === blocks.length - 1" @click="move(i, 1)" aria-label="Move down"><i class="fas fa-arrow-down"></i></button>
              <button class="icon-btn text-red-500" @click="remove(i)" aria-label="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </div>

          <!-- Heading -->
          <template v-if="block.type === 'heading'">
            <textarea v-model="(block as HeadingBlock).text" rows="2" class="input-field w-full text-sm" placeholder="Heading text"></textarea>
            <div class="mt-2 flex items-center gap-2"><span class="text-xs text-gray-500">Align</span><AlignButtons v-model="(block as HeadingBlock).align" /></div>
          </template>

          <!-- Text -->
          <template v-else-if="block.type === 'text'">
            <textarea v-model="(block as TextBlock).text" rows="4" class="input-field w-full text-sm" placeholder="Paragraph text"></textarea>
            <div class="mt-2 flex items-center gap-2"><span class="text-xs text-gray-500">Align</span><AlignButtons v-model="(block as TextBlock).align" /></div>
          </template>

          <!-- Image -->
          <template v-else-if="block.type === 'image'">
            <div v-if="(block as ImageBlock).src" class="mb-2">
              <img :src="(block as ImageBlock).src" alt="" class="max-h-40 rounded border border-gray-200 dark:border-gray-700" />
            </div>
            <label class="btn-secondary text-xs cursor-pointer inline-flex items-center">
              <i class="fas fa-upload mr-1"></i>{{ uploadingId === block.id ? 'Uploading…' : (block as ImageBlock).src ? 'Replace image' : 'Upload image' }}
              <input type="file" accept="image/*" class="hidden" :disabled="uploadingId === block.id" @change="onImageFile($event, block as ImageBlock)" />
            </label>
            <input v-model="(block as ImageBlock).alt" type="text" class="input-field w-full text-sm mt-2" placeholder="Alt text (describes the image)" />
            <input v-model="(block as ImageBlock).href" type="text" class="input-field w-full text-sm mt-2" placeholder="Link when clicked (optional)" />
          </template>

          <!-- Button -->
          <template v-else-if="block.type === 'button'">
            <input v-model="(block as ButtonBlock).label" type="text" class="input-field w-full text-sm" placeholder="Button label" />
            <input v-model="(block as ButtonBlock).href" type="text" class="input-field w-full text-sm mt-2" placeholder="https://…" />
            <div class="mt-2 flex items-center gap-2"><span class="text-xs text-gray-500">Align</span><AlignButtons v-model="(block as ButtonBlock).align" /></div>
          </template>

          <!-- Offer: a big %/£ value on the left, description on the right -->
          <template v-else-if="block.type === 'offer'">
            <div class="flex gap-2">
              <input v-model="(block as OfferBlock).value" type="text" class="input-field text-sm w-24 flex-shrink-0" placeholder="20% / £10" />
              <input v-model="(block as OfferBlock).text" type="text" class="input-field w-full text-sm" placeholder="off any massage this month" />
            </div>
            <p class="text-xs text-gray-400 mt-1">Left value (e.g. “20%” or “£10”) shows large; the text sits beside it.</p>
          </template>

          <!-- Quote -->
          <template v-else-if="block.type === 'quote'">
            <textarea v-model="(block as QuoteBlock).text" rows="3" class="input-field w-full text-sm" placeholder="Quote"></textarea>
            <input v-model="(block as QuoteBlock).author" type="text" class="input-field w-full text-sm mt-2" placeholder="Attribution (optional)" />
            <div class="mt-2 flex items-center gap-2"><span class="text-xs text-gray-500">Align</span><AlignButtons v-model="(block as QuoteBlock).align" /></div>
          </template>

          <!-- Social -->
          <template v-else-if="block.type === 'social'">
            <div v-for="(link, li) in (block as SocialBlock).links" :key="li" class="flex gap-2 mb-2">
              <select v-model="link.platform" class="input-field text-sm">
                <option v-for="(label, key) in SOCIAL_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
              <input v-model="link.url" type="text" class="input-field w-full text-sm" placeholder="https://…" />
              <button class="icon-btn text-red-500" @click="removeSocial(block as SocialBlock, li)" aria-label="Remove"><i class="fas fa-times"></i></button>
            </div>
            <button class="btn-secondary text-xs" @click="addSocial(block as SocialBlock)"><i class="fas fa-plus mr-1"></i>Add link</button>
          </template>

          <!-- Columns -->
          <template v-else-if="block.type === 'columns'">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-gray-500 mb-1">Left</p>
                <ColumnCellEditor v-model="(block as ColumnsBlock).left" :upload="store.uploadImage" @error="uploadError = $event" />
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Right</p>
                <ColumnCellEditor v-model="(block as ColumnsBlock).right" :upload="store.uploadImage" @error="uploadError = $event" />
              </div>
            </div>
          </template>

          <!-- Spacer -->
          <template v-else-if="block.type === 'spacer'">
            <select v-model="(block as SpacerBlock).size" class="input-field text-sm">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </template>

          <!-- Divider -->
          <template v-else>
            <p class="text-sm text-gray-400">A horizontal divider — no options.</p>
          </template>
        </div>
      </div>

      <!-- Result / error -->
      <div v-if="result" class="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
        <i class="fas fa-circle-check mr-1"></i>
        Sent to {{ result.sentCount }} of {{ result.recipientCount }} subscriber{{ result.recipientCount === 1 ? '' : 's' }}.
        <span v-if="result.failedCount > 0" class="text-amber-700 dark:text-amber-400">{{ result.failedCount }} failed — check the server logs.</span>
      </div>
      <div v-if="sendError" class="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {{ sendError }}
      </div>

      <!-- Send -->
      <div class="flex items-center justify-between pt-1">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Sends to <span class="font-semibold text-gray-900 dark:text-gray-100">{{ store.subscribedCount }}</span>
          subscribed contact{{ store.subscribedCount === 1 ? '' : 's' }}.
        </p>
        <button class="btn-primary text-sm" :disabled="!canSend || store.sending" @click="confirmOpen = true">
          <i class="fas fa-paper-plane mr-1"></i>{{ store.sending ? 'Sending…' : 'Send campaign' }}
        </button>
      </div>
    </div>

    <!-- Preview + history -->
    <div class="space-y-6">
      <div class="card lg:sticky lg:top-6">
        <div class="card-header"><h3 class="font-semibold">Preview</h3></div>
        <div class="card-body">
          <div class="email-preview">
            <div class="email-preview__header">
              <img src="/logo.png" alt="North Peak Massage" class="email-preview__logo" />
              <div class="email-preview__tagline">Mobile massage · New Mills &amp; High Peak</div>
            </div>
            <div class="email-preview__body">
              <p class="text-base font-semibold mb-3 text-gray-900">{{ subject || 'Your subject will appear here' }}</p>
              <div v-if="renderedHtml" class="email-preview__content" v-html="renderedHtml"></div>
              <p v-else class="text-sm text-gray-400 italic">Your email will appear here as you add blocks.</p>
              <div class="email-preview__footer">
                You're receiving this because you opted in to updates from North Peak Massage.<br />
                <span class="email-preview__unsub">Unsubscribe</span> — takes effect straight away.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="font-semibold">Recent sends</h3></div>
        <div class="card-body">
          <p v-if="store.campaigns.length === 0" class="text-sm text-gray-500">Nothing sent yet.</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="c in store.campaigns" :key="c.id" class="py-2.5 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{{ c.subject }}</p>
                <p class="text-xs text-gray-500">{{ formatDateTime(c.sentAt) }}</p>
              </div>
              <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {{ c.sentCount }}/{{ c.recipientCount }} sent<span v-if="c.failedCount"> · {{ c.failedCount }} failed</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Confirm send modal -->
    <div v-if="confirmOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="confirmOpen = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Send this campaign?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will email <span class="font-semibold">{{ store.subscribedCount }}</span>
          subscribed contact{{ store.subscribedCount === 1 ? '' : 's' }}. This can't be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary text-sm" :disabled="store.sending" @click="confirmOpen = false">Cancel</button>
          <button class="btn-primary text-sm" :disabled="store.sending" @click="doSend">{{ store.sending ? 'Sending…' : 'Yes, send now' }}</button>
        </div>
      </div>
    </div>

    <!-- Save template modal -->
    <div v-if="saveOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="saveOpen = false">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Save as template</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Save this design to reuse later. Sending isn't affected.</p>
        <input v-model="templateName" type="text" class="input-field w-full mb-4" placeholder="Template name" @keyup.enter="saveTemplate" />
        <div class="flex justify-end gap-2">
          <button class="btn-secondary text-sm" :disabled="saving" @click="saveOpen = false">Cancel</button>
          <button class="btn-primary text-sm" :disabled="saving || !templateName.trim()" @click="saveTemplate">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useMarketingStore } from '@/stores/marketing'
import type { MarketingSendResult } from '@/types'
import AlignButtons from '@/components/AlignButtons.vue'
import ColumnCellEditor from '@/components/ColumnCellEditor.vue'
import {
  renderBlocksHtml, makeBlock, BLOCK_PALETTE, BLOCK_LABELS, BLOCK_ICONS, SOCIAL_LABELS,
} from '@/utils/marketingBlocks'
import type {
  MarketingBlock, MarketingBlockType,
  HeadingBlock, TextBlock, ImageBlock, ButtonBlock, OfferBlock, QuoteBlock, SocialBlock, ColumnsBlock, SpacerBlock,
} from '@/utils/marketingBlocks'

const store = useMarketingStore()
const palette = BLOCK_PALETTE

const subject = ref('')
const blocks = ref<MarketingBlock[]>([])
const confirmOpen = ref(false)
const saveOpen = ref(false)
const templateName = ref('')
const saving = ref(false)
const result = ref<MarketingSendResult | null>(null)
const sendError = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const uploadingId = ref<string | null>(null)

const renderedHtml = computed(() => renderBlocksHtml(blocks.value))
const canSend = computed(() => subject.value.trim() !== '' && blocks.value.length > 0 && store.subscribedCount > 0)

function addBlock(type: MarketingBlockType) {
  blocks.value.push(makeBlock(type))
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= blocks.value.length) return
  const arr = blocks.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}
function remove(i: number) {
  blocks.value.splice(i, 1)
}
function addSocial(block: SocialBlock) {
  block.links.push({ platform: 'instagram', url: '' })
}
function removeSocial(block: SocialBlock, i: number) {
  block.links.splice(i, 1)
}

async function onImageFile(e: Event, block: ImageBlock) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadError.value = null
  uploadingId.value = block.id
  try {
    block.src = await store.uploadImage(file)
  } catch (err: unknown) {
    const ex = err as { response?: { data?: { error?: string } } }
    uploadError.value = ex.response?.data?.error || 'Image upload failed.'
  } finally {
    uploadingId.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function doSend() {
  sendError.value = null
  result.value = null
  try {
    result.value = await store.send(subject.value.trim(), renderedHtml.value)
    subject.value = ''
    blocks.value = []
    await store.refreshSubscribedCount()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } }; message?: string }
    sendError.value = e.response?.data?.error || e.message || 'Failed to send the campaign.'
  } finally {
    confirmOpen.value = false
  }
}

function openSave() {
  templateName.value = ''
  saveOpen.value = true
}
async function saveTemplate() {
  if (!templateName.value.trim()) return
  saving.value = true
  try {
    await store.saveTemplate(templateName.value.trim(), subject.value.trim(), blocks.value)
    saveOpen.value = false
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    uploadError.value = e.response?.data?.error || 'Failed to save template.'
  } finally {
    saving.value = false
  }
}

function formatDateTime(date: string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

onMounted(() => {
  // Prefilled from a template's "Use" action, if any.
  const draft = store.takeDraft()
  if (draft) {
    subject.value = draft.subject
    blocks.value = draft.blocks
  }
  store.refreshSubscribedCount()
  store.fetchCampaigns()
})
</script>

<style scoped>
.icon-btn {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #6b7280;
}
.icon-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}
.icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.email-preview {
  border: 1px solid #e0e6da;
  border-radius: 12px;
  overflow: hidden;
  background: #eef3ea;
}
.email-preview__header {
  background: #ffffff;
  text-align: center;
  padding: 18px 16px 14px;
  border-bottom: 3px solid #4f7248;
}
.email-preview__logo {
  height: 40px;
  width: auto;
  margin: 0 auto;
  display: block;
}
.email-preview__tagline {
  margin-top: 8px;
  color: #7a8778;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.email-preview__body {
  background: #fff;
  padding: 20px;
}
.email-preview__content :deep(img) {
  max-width: 100%;
}
.email-preview__footer {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #e0e6da;
  font-size: 11px;
  color: #9aa79a;
}
.email-preview__unsub {
  color: #3b5636;
  font-weight: 600;
  text-decoration: underline;
}
</style>
