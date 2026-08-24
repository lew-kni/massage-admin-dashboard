<template>
  <div class="space-y-2">
    <select
      :value="cell.kind"
      @change="changeKind(($event.target as HTMLSelectElement).value as ColumnCell['kind'])"
      class="input-field w-full text-sm"
    >
      <option value="text">Text</option>
      <option value="image">Image</option>
      <option value="empty">Empty</option>
    </select>

    <template v-if="cell.kind === 'text'">
      <textarea
        v-model="(cell as TextCell).text"
        rows="4"
        class="input-field w-full text-sm"
        placeholder="Column text"
      ></textarea>
    </template>

    <template v-else-if="cell.kind === 'image'">
      <div v-if="(cell as ImageCell).src" class="mb-1">
        <img :src="(cell as ImageCell).src" alt="" class="max-h-24 rounded border border-gray-200 dark:border-gray-700" />
      </div>
      <label class="btn-secondary text-xs cursor-pointer inline-flex items-center">
        <i class="fas fa-upload mr-1"></i>{{ uploading ? 'Uploading…' : (cell as ImageCell).src ? 'Replace image' : 'Upload image' }}
        <input type="file" accept="image/*" class="hidden" @change="onFile" :disabled="uploading" />
      </label>
      <input v-model="(cell as ImageCell).alt" type="text" class="input-field w-full text-sm" placeholder="Alt text" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ColumnCell, TextCell, ImageCell } from '@/utils/marketingBlocks'
import { makeCell } from '@/utils/marketingBlocks'

const cell = defineModel<ColumnCell>({ required: true })
const props = defineProps<{ upload: (file: File) => Promise<string> }>()
const emit = defineEmits<{ error: [string] }>()

const uploading = ref(false)

function changeKind(kind: ColumnCell['kind']) {
  cell.value = makeCell(kind)
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const url = await props.upload(file)
    if (cell.value.kind === 'image') cell.value.src = url
  } catch (err: unknown) {
    const ex = err as { response?: { data?: { error?: string } } }
    emit('error', ex.response?.data?.error || 'Image upload failed.')
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>
