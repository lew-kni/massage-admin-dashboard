<script setup lang="ts">
import { ref, computed } from 'vue'

interface Marker {
  view: 'front' | 'back'
  x: number
  y: number
  type: 'pain' | 'tension' | 'injury' | 'avoid'
  note?: string
}

const props = withDefaults(defineProps<{ markers?: Marker[] }>(), { markers: () => [] })

const markerTypes = [
  { key: 'pain', label: 'Pain', color: '#dc2626' },
  { key: 'tension', label: 'Tension', color: '#d97706' },
  { key: 'injury', label: 'Injury', color: '#7c3aed' },
  { key: 'avoid', label: 'Avoid', color: '#334155' },
] as const

const currentView = ref<'front' | 'back'>('front')
const colorFor = (type: string) => markerTypes.find((t) => t.key === type)?.color || '#334155'
const viewMarkers = computed(() => (props.markers || []).filter((m) => m.view === currentView.value))
const usedTypes = computed(() => markerTypes.filter((t) => (props.markers || []).some((m) => m.type === t.key)))
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <div class="inline-flex rounded border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          class="px-3 py-1"
          :class="currentView === 'front' ? 'bg-sage-600 text-white' : 'bg-white text-gray-600'"
          @click="currentView = 'front'"
        >Front</button>
        <button
          type="button"
          class="px-3 py-1"
          :class="currentView === 'back' ? 'bg-sage-600 text-white' : 'bg-white text-gray-600'"
          @click="currentView = 'back'"
        >Back</button>
      </div>
      <div class="flex flex-wrap gap-3 text-xs">
        <span v-for="t in usedTypes" :key="t.key" class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: t.color }"></span>{{ t.label }}
        </span>
      </div>
    </div>

    <div class="relative mx-auto" style="max-width: 220px">
      <svg viewBox="0 0 200 440" class="block w-full h-auto" aria-hidden="true">
        <g fill="rgba(107,127,94,0.18)" stroke="#4b5a41" stroke-width="1.5">
          <circle cx="100" cy="40" r="26" />
          <rect x="88" y="60" width="24" height="22" />
          <rect x="56" y="76" width="88" height="142" rx="26" />
          <rect x="32" y="84" width="24" height="152" rx="12" />
          <rect x="144" y="84" width="24" height="152" rx="12" />
          <rect x="62" y="205" width="32" height="225" rx="16" />
          <rect x="106" y="205" width="32" height="225" rx="16" />
        </g>
        <line v-if="currentView === 'back'" x1="100" y1="84" x2="100" y2="210" stroke="#4b5a41" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5" />
      </svg>
      <span
        v-for="(m, i) in viewMarkers"
        :key="i"
        class="absolute rounded-full border-2 border-white"
        style="width: 18px; height: 18px; transform: translate(-50%, -50%); box-shadow: 0 1px 3px rgba(0,0,0,0.3)"
        :style="{ left: m.x + '%', top: m.y + '%', background: colorFor(m.type) }"
        :title="`${m.type}${m.note ? ' — ' + m.note : ''}`"
      ></span>
    </div>

    <ul v-if="markers.length" class="mt-3 space-y-1 text-sm">
      <li v-for="(m, i) in markers" :key="i" class="flex items-center gap-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: colorFor(m.type) }"></span>
        <span class="capitalize text-gray-700">{{ m.view }} · {{ m.type }}</span>
        <span v-if="m.note" class="text-gray-500">— {{ m.note }}</span>
      </li>
    </ul>
  </div>
</template>
