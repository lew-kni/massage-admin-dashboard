<template>
  <div>
    <div
      class="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white overflow-hidden"
      :style="{ height: `${height}px` }"
    >
      <canvas
        ref="canvasEl"
        class="block w-full h-full touch-none cursor-crosshair"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointerleave="onUp"
        @pointercancel="onUp"
      ></canvas>

      <!-- Baseline + hint, shown only while empty -->
      <div v-if="isEmpty" class="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
        <span class="text-sm text-gray-400 border-t border-dashed border-gray-300 pt-1 px-8">Sign here</span>
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between">
      <p class="text-xs text-gray-400">Sign with a finger, stylus or mouse.</p>
      <button
        type="button"
        @click="clear"
        :disabled="isEmpty"
        class="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <i class="fas fa-eraser mr-1"></i>Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{ modelValue?: string | null; height?: number }>(), {
  modelValue: null,
  height: 160,
})
const emit = defineEmits<{ (e: 'update:modelValue', value: string | null): void }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const isEmpty = ref(true)
let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let dirtied = false // has the user drawn since the last export?
let last = { x: 0, y: 0 }

// Fill the backing store with white so the exported PNG reads on any surface
// (the booking view renders it on white cards).
function paintBackground() {
  if (!ctx || !canvasEl.value) return
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height)
  ctx.restore()
}

function setupCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1f2937' // gray-800 — dark ink, readable everywhere
  paintBackground()

  if (props.modelValue) {
    const img = new Image()
    img.onload = () => {
      if (!ctx) return
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
      isEmpty.value = false
    }
    img.src = props.modelValue
  }
}

function pointFromEvent(e: PointerEvent) {
  const rect = canvasEl.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onDown(e: PointerEvent) {
  if (!ctx) return
  drawing = true
  canvasEl.value?.setPointerCapture(e.pointerId)
  last = pointFromEvent(e)
  // A single tap should leave a dot
  ctx.beginPath()
  ctx.moveTo(last.x, last.y)
  ctx.lineTo(last.x + 0.01, last.y + 0.01)
  ctx.stroke()
  isEmpty.value = false
  dirtied = true
}

function onMove(e: PointerEvent) {
  if (!drawing || !ctx) return
  const p = pointFromEvent(e)
  ctx.beginPath()
  ctx.moveTo(last.x, last.y)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
  last = p
  dirtied = true
}

function onUp(e: PointerEvent) {
  if (!drawing) return
  drawing = false
  try { canvasEl.value?.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  if (dirtied) {
    dirtied = false
    emit('update:modelValue', canvasEl.value!.toDataURL('image/png'))
  }
}

function clear() {
  paintBackground()
  isEmpty.value = true
  dirtied = false
  emit('update:modelValue', null)
}

onMounted(setupCanvas)
onBeforeUnmount(() => { ctx = null })

defineExpose({ clear })
</script>
