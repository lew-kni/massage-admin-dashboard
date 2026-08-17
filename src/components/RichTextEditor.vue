<template>
  <div class="rich-editor border rounded-md dark:border-gray-700 overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 px-2 py-1.5 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <button type="button" title="Bold" class="tool-btn" @mousedown.prevent="cmd('bold')">
        <i class="fas fa-bold"></i>
      </button>
      <button type="button" title="Italic" class="tool-btn" @mousedown.prevent="cmd('italic')">
        <i class="fas fa-italic"></i>
      </button>
      <span class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></span>
      <button type="button" title="Bullet list" class="tool-btn" @mousedown.prevent="cmd('insertUnorderedList')">
        <i class="fas fa-list-ul"></i>
      </button>
      <button type="button" title="Numbered list" class="tool-btn" @mousedown.prevent="cmd('insertOrderedList')">
        <i class="fas fa-list-ol"></i>
      </button>
      <button type="button" title="Add link" class="tool-btn" @mousedown.prevent="addLink">
        <i class="fas fa-link"></i>
      </button>
      <span class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></span>
      <button type="button" title="Clear formatting" class="tool-btn" @mousedown.prevent="cmd('removeFormat')">
        <i class="fas fa-eraser"></i>
      </button>
    </div>

    <!-- Editable surface -->
    <div
      ref="el"
      contenteditable="true"
      class="rich-editor-body px-3 py-2 min-h-[220px] max-h-[420px] overflow-y-auto focus:outline-none text-sm text-[#202a20] dark:text-gray-100"
      @input="onInput"
      @paste="onPaste"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const el = ref<HTMLDivElement>()

// Push the model into the DOM only when the change originated *outside* the
// editor (e.g. a template was applied) — writing innerHTML while the user is
// typing would collapse the caret to the start on every keystroke.
function syncFromModel() {
  if (el.value && el.value.innerHTML !== (props.modelValue || '')) {
    el.value.innerHTML = props.modelValue || ''
  }
}

onMounted(syncFromModel)
watch(
  () => props.modelValue,
  () => {
    if (document.activeElement !== el.value) syncFromModel()
  },
)

function emitCurrent() {
  emit('update:modelValue', el.value?.innerHTML || '')
}

function onInput() {
  emitCurrent()
}

// execCommand is deprecated but remains the only broadly-supported way to do
// inline rich-text editing without pulling in a heavyweight editor library; it
// is more than enough for tweaking a pre-rendered email.
function cmd(command: string, value?: string) {
  el.value?.focus()
  document.execCommand(command, false, value)
  emitCurrent()
}

function addLink() {
  const url = window.prompt('Link URL')
  if (url) cmd('createLink', url)
}

// Paste as plain text so copying from another email/site can't inject messy or
// unsafe markup into the message.
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  emitCurrent()
}

// Sanitised current HTML, for the parent to read before sending.
defineExpose({
  getSanitizedHtml: () => DOMPurify.sanitize(el.value?.innerHTML || ''),
})
</script>

<style scoped>
.tool-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}
.tool-btn:hover {
  background: #e5e7eb;
}
:global(.dark) .tool-btn {
  color: #d1d5db;
}
:global(.dark) .tool-btn:hover {
  background: #374151;
}
.rich-editor-body :deep(p) {
  margin: 0 0 0.85em;
}
.rich-editor-body :deep(ul),
.rich-editor-body :deep(ol) {
  margin: 0 0 0.85em;
  padding-left: 1.25em;
}
.rich-editor-body :deep(a) {
  color: #4f7248;
  text-decoration: underline;
}
</style>
