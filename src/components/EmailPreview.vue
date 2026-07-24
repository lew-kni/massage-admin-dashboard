<template>
  <div class="bg-[#f2f6ef] rounded-lg p-6">
    <div class="max-w-[420px] mx-auto bg-white rounded-xl overflow-hidden border border-[#e0e6da]">
      <div class="text-center px-6 pt-7 pb-6 border-b-[3px] border-[#4f7248]">
        <img src="/logo-side.png" alt="North Peak Massage" class="inline-block h-[36px] w-auto" />
      </div>
      <div class="px-6 py-6">
        <p class="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Subject</p>
        <p class="text-sm font-semibold text-[#202a20] mb-4 break-words">{{ subject || '(no subject)' }}</p>
        <div
          class="text-[13px] leading-relaxed text-[#202a20] email-preview-body"
          v-html="bodyHtml || '<p class=\'text-gray-400 italic\'>(no message yet)</p>'"
        ></div>
      </div>
      <div class="px-6 py-4 border-t border-[#e0e6da]">
        <p class="m-0 text-[10px] text-[#7a8778]">North Peak Massage &middot; High Peak</p>
        <p class="m-0 mt-1 text-[10px] text-[#7a8778]">&copy; {{ year }} North Peak Massage. This message relates to your enquiry or appointment.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ subject: string; bodyHtml: string }>()
const year = new Date().getFullYear()
</script>

<style scoped>
.email-preview-body :deep(p) {
  margin: 0 0 0.85em;
}
.email-preview-body :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
