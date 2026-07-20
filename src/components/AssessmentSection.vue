<template>
  <div class="card">
    <div class="card-header flex justify-between items-center">
      <h2 class="text-lg font-semibold">
        <i class="fas fa-notes-medical mr-2"></i>Pre-Massage Assessment
      </h2>
      <div class="flex items-center gap-3">
        <span v-if="dirty" class="text-xs text-amber-600">
          <i class="fas fa-circle-exclamation mr-1"></i>Unsaved changes
        </span>
        <span v-else-if="assessment?.updatedAt" class="text-xs text-gray-400">
          Saved {{ formatRelative(assessment.updatedAt) }}
        </span>
      </div>
    </div>

    <div class="card-body space-y-6">
      <div v-if="loading" class="text-sm text-gray-500 py-2">Loading assessment…</div>

      <template v-else>
        <!-- Findings, one card per body area -->
        <div v-if="!form.findings.length" class="border-l-4 border-sage-300 pl-4 py-2">
          <p class="text-gray-700 font-medium">No areas assessed yet</p>
          <p class="text-sm text-gray-500">Add a body area to record posture, movement and palpation notes.</p>
        </div>

        <div
          v-for="(finding, index) in form.findings"
          :key="index"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <!-- Body part is the parent: its header carries area, side and source -->
          <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex flex-wrap items-center gap-3">
            <select
              v-model="finding.bodyPart"
              class="input-field !w-auto min-w-[11rem] font-medium"
              @change="onBodyPartChange(finding)"
            >
              <option v-for="part in BODY_PARTS" :key="part.value" :value="part.value">
                {{ part.label }}
              </option>
            </select>

            <select
              v-if="isPaired(finding.bodyPart)"
              v-model="finding.side"
              class="input-field !w-auto"
              aria-label="Side"
            >
              <option v-for="opt in SIDE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <!-- Observation vs. client-reported -->
            <div class="inline-flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                v-for="opt in SOURCE_OPTIONS"
                :key="opt.value"
                type="button"
                :title="opt.hint"
                @click="finding.source = opt.value"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  finding.source === opt.value
                    ? 'bg-sage-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50',
                ]"
              >
                <i :class="['fas mr-1', opt.value === 'OBSERVED' ? 'fa-eye' : 'fa-comment']"></i>
                {{ opt.label }}
              </button>
            </div>

            <button
              type="button"
              @click="removeFinding(index)"
              class="ml-auto text-red-600 hover:text-red-700 text-sm"
              :aria-label="`Remove ${bodyPartLabel(finding.bodyPart)}`"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>

          <div class="p-4 space-y-4">
            <!-- Muscles: catalogue picks and freehand entries -->
            <div>
              <label class="text-sm text-gray-500">Muscles / structures</label>
              <div v-if="finding.muscles.length" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="muscle in finding.muscles"
                  :key="muscle"
                  class="inline-flex items-center gap-1.5 bg-sage-100 text-sage-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {{ muscle }}
                  <button
                    type="button"
                    @click="removeMuscle(finding, muscle)"
                    class="hover:text-sage-950"
                    :aria-label="`Remove ${muscle}`"
                  >
                    <i class="fas fa-xmark"></i>
                  </button>
                </span>
              </div>
              <input
                :list="`muscles-${index}`"
                v-model="muscleDrafts[index]"
                type="text"
                class="input-field mt-2"
                placeholder="Type or pick a muscle, then press Enter"
                @keydown.enter.prevent="addMuscle(finding, index)"
                @change="addMuscle(finding, index)"
              />
              <datalist :id="`muscles-${index}`">
                <option
                  v-for="muscle in suggestedMuscles(finding)"
                  :key="muscle"
                  :value="muscle"
                ></option>
              </datalist>
            </div>

            <!-- Assessment notes -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500">Posture</label>
                <textarea v-model="finding.posture" class="input-field mt-1" rows="2"></textarea>
              </div>
              <div>
                <label class="text-sm text-gray-500">Movement / ROM</label>
                <textarea v-model="finding.movement" class="input-field mt-1" rows="2"></textarea>
              </div>
              <div>
                <label class="text-sm text-gray-500">Palpation</label>
                <textarea v-model="finding.palpation" class="input-field mt-1" rows="2"></textarea>
              </div>
              <div>
                <label class="text-sm text-gray-500">Other notes</label>
                <textarea v-model="finding.notes" class="input-field mt-1" rows="2"></textarea>
              </div>
            </div>

            <!-- Functional scale -->
            <div>
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-500">Functional scale (1–10)</label>
                <button
                  v-if="finding.functionalScale"
                  type="button"
                  @click="finding.functionalScale = null"
                  class="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <button
                  v-for="n in 10"
                  :key="n"
                  type="button"
                  @click="finding.functionalScale = n"
                  :class="[
                    'w-9 h-9 rounded-md text-sm font-medium border transition-colors',
                    finding.functionalScale === n
                      ? 'bg-sage-600 border-sage-600 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-sage-400',
                  ]"
                >
                  {{ n }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="button" @click="addFinding" class="btn-secondary text-sm">
          <i class="fas fa-plus"></i>
          <span>Add body area</span>
        </button>

        <!-- Treatment plan -->
        <div class="border-t pt-6 space-y-4">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Treatment plan</h3>
          <div>
            <label class="text-sm text-gray-500">Clinical findings</label>
            <textarea v-model="form.clinicalFindings" class="input-field mt-1" rows="3"></textarea>
          </div>
          <div>
            <label class="text-sm text-gray-500">Proposed action</label>
            <textarea v-model="form.proposedAction" class="input-field mt-1" rows="3"></textarea>
          </div>
          <div>
            <label class="text-sm text-gray-500">General notes</label>
            <textarea v-model="form.generalNotes" class="input-field mt-1" rows="2"></textarea>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button type="button" @click="save" :disabled="saving || !dirty" class="btn-primary text-sm">
            <i class="fas fa-floppy-disk"></i>
            <span>{{ saving ? 'Saving…' : 'Save Assessment' }}</span>
          </button>
          <button v-if="dirty" type="button" @click="reset" class="btn-secondary text-sm">Discard changes</button>
        </div>
        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { apiService } from '@/services/api'
import type { AssessmentFinding, BookingAssessment } from '@/types'
import { BODY_PARTS, SIDE_OPTIONS, SOURCE_OPTIONS, bodyPartLabel, findBodyPart } from '@/constants/anatomy'

const props = defineProps<{ bookingId: string }>()

const assessment = ref<BookingAssessment | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
// Per-finding text in the muscle combobox, keyed by row index
const muscleDrafts = reactive<Record<number, string>>({})

const form = reactive({
  clinicalFindings: '',
  proposedAction: '',
  generalNotes: '',
  findings: [] as AssessmentFinding[],
})

// Snapshot of the last saved state, used to detect unsaved edits
const baseline = ref('')
const dirty = computed(() => JSON.stringify(form) !== baseline.value)

function snapshot() {
  baseline.value = JSON.stringify(form)
}

function applyAssessment(a: BookingAssessment | null) {
  form.clinicalFindings = a?.clinicalFindings || ''
  form.proposedAction = a?.proposedAction || ''
  form.generalNotes = a?.generalNotes || ''
  form.findings = (a?.findings || []).map(f => ({
    bodyPart: f.bodyPart,
    side: f.side || 'N/A',
    muscles: [...(f.muscles || [])],
    source: f.source || 'OBSERVED',
    posture: f.posture || '',
    movement: f.movement || '',
    palpation: f.palpation || '',
    functionalScale: f.functionalScale ?? null,
    notes: f.notes || '',
  }))
  snapshot()
}

function isPaired(bodyPart: string): boolean {
  return findBodyPart(bodyPart)?.paired ?? false
}

// Catalogue muscles for this area, minus the ones already picked
function suggestedMuscles(finding: AssessmentFinding): string[] {
  const all = findBodyPart(finding.bodyPart)?.muscles || []
  return all.filter(m => !finding.muscles.includes(m))
}

function addFinding() {
  form.findings.push({
    bodyPart: BODY_PARTS[0].value,
    side: 'N/A',
    muscles: [],
    source: 'OBSERVED',
    posture: '',
    movement: '',
    palpation: '',
    functionalScale: null,
    notes: '',
  })
}

function removeFinding(index: number) {
  const finding = form.findings[index]
  const hasContent =
    finding.muscles.length ||
    finding.posture ||
    finding.movement ||
    finding.palpation ||
    finding.notes ||
    finding.functionalScale
  if (hasContent && !confirm(`Remove the ${bodyPartLabel(finding.bodyPart)} entry and its notes?`)) return
  form.findings.splice(index, 1)
  // Drafts are index-keyed, so shift them down to stay with their rows
  for (let i = index; i < form.findings.length; i++) {
    muscleDrafts[i] = muscleDrafts[i + 1] || ''
  }
  delete muscleDrafts[form.findings.length]
}

function addMuscle(finding: AssessmentFinding, index: number) {
  const value = (muscleDrafts[index] || '').trim()
  if (!value) return
  if (!finding.muscles.includes(value)) finding.muscles.push(value)
  muscleDrafts[index] = ''
}

function removeMuscle(finding: AssessmentFinding, muscle: string) {
  finding.muscles = finding.muscles.filter(m => m !== muscle)
}

// Side is meaningless on unpaired areas (abdomen, head) — normalise it away
function onBodyPartChange(finding: AssessmentFinding) {
  if (!isPaired(finding.bodyPart)) finding.side = 'N/A'
}

function formatRelative(date?: string): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    assessment.value = await apiService.saveAssessment(props.bookingId, {
      clinicalFindings: form.clinicalFindings.trim() || null,
      proposedAction: form.proposedAction.trim() || null,
      generalNotes: form.generalNotes.trim() || null,
      findings: form.findings.map((f, i) => ({ ...f, sortOrder: i })),
    })
    applyAssessment(assessment.value)
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to save the assessment'
  } finally {
    saving.value = false
  }
}

function reset() {
  applyAssessment(assessment.value)
  error.value = ''
}

onMounted(async () => {
  try {
    assessment.value = await apiService.getAssessment(props.bookingId)
  } catch {
    assessment.value = null
  }
  applyAssessment(assessment.value)
  loading.value = false
})
</script>
