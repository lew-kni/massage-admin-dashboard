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

// Right half of the generic body outline (kept in sync with the client component).
const BODY_HALF =
  'M100 22 C120 22 130 40 130 56 C130 67 125 74 118 79 C118 84 117 87 117 91 C126 95 139 100 151 110 C159 118 161 139 159 162 C158 185 154 206 151 226 C153 235 150 241 144 240 C139 239 139 233 140 226 C142 204 144 182 145 159 C145 140 141 124 134 118 C130 142 128 164 126 186 C125 202 130 215 136 227 C140 272 135 342 127 404 C125 430 123 450 122 460 C122 468 126 472 130 468 C124 474 112 474 108 469 C107 462 110 458 111 453 C113 420 112 372 111 330 C109 300 105 274 102 252 C101 247 100 247 100 250'

const currentView = ref<'front' | 'back'>('front')
const colorFor = (type: string) => markerTypes.find((t) => t.key === type)?.color || '#334155'
const viewMarkers = computed(() => (props.markers || []).filter((m) => m.view === currentView.value))
const usedTypes = computed(() => markerTypes.filter((t) => (props.markers || []).some((m) => m.type === t.key)))
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <div class="inline-flex rounded border border-gray-200 overflow-hidden text-sm">
        <button type="button" class="px-3 py-1" :class="currentView === 'front' ? 'bg-sage-600 text-white' : 'bg-white text-gray-600'" @click="currentView = 'front'">Front</button>
        <button type="button" class="px-3 py-1" :class="currentView === 'back' ? 'bg-sage-600 text-white' : 'bg-white text-gray-600'" @click="currentView = 'back'">Back</button>
      </div>
      <div class="flex flex-wrap gap-3 text-xs">
        <span v-for="t in usedTypes" :key="t.key" class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: t.color }"></span>{{ t.label }}
        </span>
      </div>
    </div>

    <div class="relative mx-auto" style="max-width: 210px">
      <svg viewBox="0 0 200 480" class="block w-full h-auto" aria-hidden="true">
        <g fill="rgba(107,127,94,0.16)" stroke="#4b5a41" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
          <path :d="BODY_HALF" />
          <path :d="BODY_HALF" transform="translate(200,0) scale(-1,1)" />
        </g>
        <line v-if="currentView === 'back'" x1="100" y1="98" x2="100" y2="218" stroke="#4b5a41" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.4" />
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
