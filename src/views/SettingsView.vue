<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-6">
      <h1 class="dark:text-gray-50">Email</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Templates, send history, and delivery settings
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="setTab(tab.key)"
        :class="[
          'px-4 py-3 font-medium border-b-2 whitespace-nowrap',
          activeTab === tab.key
            ? 'border-sage-600 text-sage-600'
            : 'border-transparent text-gray-600 dark:text-gray-400',
        ]"
      >
        <i :class="[tab.icon, 'mr-2']"></i>{{ tab.label }}
      </button>
    </div>

    <EmailTemplatesTab v-if="activeTab === 'templates'" />
    <EmailTriggersTab v-else-if="activeTab === 'triggers'" />
    <SendHistoryTab v-else-if="activeTab === 'history'" />
    <EmailDeliveryTab v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmailTemplatesTab from '@/components/email/EmailTemplatesTab.vue'
import EmailTriggersTab from '@/components/email/EmailTriggersTab.vue'
import SendHistoryTab from '@/components/email/SendHistoryTab.vue'
import EmailDeliveryTab from '@/components/email/EmailDeliveryTab.vue'

type TabKey = 'templates' | 'triggers' | 'history' | 'sending'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'templates', label: 'Email Templates', icon: 'fas fa-envelope-open-text' },
  { key: 'triggers', label: 'Triggers', icon: 'fas fa-bolt' },
  { key: 'history', label: 'Send History', icon: 'fas fa-clock-rotate-left' },
  { key: 'sending', label: 'Sending & SMTP', icon: 'fas fa-server' },
]

const route = useRoute()
const router = useRouter()

function normalise(tab: unknown): TabKey {
  return tab === 'triggers' || tab === 'history' || tab === 'sending' ? tab : 'templates'
}

const activeTab = ref<TabKey>(normalise(route.query.tab))

function setTab(tab: TabKey) {
  activeTab.value = tab
  // Reflect the tab in the URL so it's shareable / survives a refresh, without
  // pushing a new history entry for every tab click.
  router.replace({ query: { ...route.query, tab } })
}

// Keep in sync if the query changes from elsewhere (e.g. a deep link).
watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = normalise(tab)
  },
)
</script>
