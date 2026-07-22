<template>
  <div class="bg-[#f4f5f2] rounded-lg p-6">
    <div class="max-w-[420px] mx-auto bg-white rounded-xl overflow-hidden shadow-sm">
      <div class="bg-[#4f7248] px-6 py-5">
        <p class="m-0 text-[15px] font-bold text-white tracking-[1px] uppercase">North Peak</p>
        <p class="m-0 mt-1 text-[9px] font-semibold text-[#8fd3f0] tracking-[3px] uppercase">Massage</p>
      </div>
      <div class="px-6 py-6">
        <p class="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Subject</p>
        <p class="text-sm font-semibold text-[#2f3a2c] mb-4 break-words">{{ subject || '(no subject)' }}</p>
        <div
          class="text-[13px] leading-relaxed text-[#2f3a2c] email-preview-body"
          v-html="bodyHtml || '<p class=\'text-gray-400 italic\'>(no message yet)</p>'"
        ></div>
      </div>
      <div class="px-6 py-4 border-t border-[#eceee9]">
        <p class="m-0 text-[10px] text-[#8a8f85]">North Peak Massage &middot; High Peak</p>
        <p class="m-0 mt-1 text-[10px] text-[#8a8f85]">&copy; {{ year }} North Peak Massage. This message relates to your enquiry or appointment.</p>
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
