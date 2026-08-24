<template>
  <div class="email-preview">
    <div class="email-preview__header">
      <img src="/logo.png" alt="North Peak Massage" class="email-preview__logo" />
      <div class="email-preview__tagline">Mobile massage &middot; New Mills &amp; High Peak</div>
    </div>
    <div class="email-preview__body">
      <p v-if="subject" class="email-preview__subject">{{ subject }}</p>
      <div v-if="html" class="email-preview__content" v-html="html"></div>
      <p v-else class="email-preview__empty">This email has no content yet.</p>
      <div class="email-preview__footer">
        You're receiving this because you opted in to updates from North Peak Massage.<br />
        <span class="email-preview__unsub">Unsubscribe</span> — takes effect straight away.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderBlocksHtml, type MarketingBlock } from '@/utils/marketingBlocks'

const props = defineProps<{ subject?: string; blocks: MarketingBlock[] }>()

const html = computed(() => renderBlocksHtml(props.blocks))
</script>

<style scoped>
.email-preview {
  border: 1px solid #e0e6da;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f6ef;
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
.email-preview__subject {
  font-size: 1rem;
  font-weight: 600;
  color: #202a20;
  margin-bottom: 12px;
}
.email-preview__empty {
  font-size: 0.9rem;
  color: #9ca3af;
  font-style: italic;
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
