<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Availability</h1>
      <p class="text-gray-600 mt-2">Set your working hours and manage time off</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8 border-b">
      <button
        @click="activeTab = 'general'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'general' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
<i class="fas fa-calendar-days mr-2"></i>General Availability
      </button>
      <button
        @click="activeTab = 'unavailable'"
        :class="['px-4 py-3 font-medium border-b-2', activeTab === 'unavailable' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        <i class="fas fa-ban mr-2"></i>Unavailable Blocks
      </button>
    </div>

    <!-- General Availability Tab -->
    <div v-if="activeTab === 'general'" class="space-y-6">
      <!-- Booking Settings -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">Booking Settings</h2>
        </div>
        <div class="card-body">
          <div class="flex items-start gap-4 flex-wrap">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buffer between appointments</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="bufferMinutes"
                  type="number"
                  min="0"
                  max="240"
                  step="5"
                  class="input-field text-sm w-24"
                />
                <span class="text-sm text-gray-500">minutes</span>
              </div>
              <p class="text-xs text-gray-400 mt-1 max-w-md">Packdown / travel time reserved after each appointment before the next one can start.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slot interval</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="slotIntervalMinutes"
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  class="input-field text-sm w-24"
                />
                <span class="text-sm text-gray-500">minutes</span>
              </div>
              <p class="text-xs text-gray-400 mt-1 max-w-md">Granularity of offered start times (e.g. every 30 minutes).</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Schedule -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-lg font-semibold">Weekly Schedule</h2>
          <div class="flex items-center gap-3">
            <span v-if="saveMessage" class="text-sm text-green-600"><i class="fas fa-check mr-1"></i>{{ saveMessage }}</span>
            <button @click="saveGeneralAvailability" :disabled="saving" class="btn-primary text-sm">
              <i class="fas fa-floppy-disk"></i>
              <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="saveError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p class="text-sm text-red-700">{{ saveError }}</p>
          </div>
          <div class="space-y-4">
            <div v-for="(day, index) in weekDays" :key="day" class="pb-4 border-b last:border-0">
              <div class="flex items-center gap-4 mb-3">
                <input
                  type="checkbox"
                  v-model="generalAvailability[index].available"
                  class="w-4 h-4"
                />
                <span class="font-medium w-24">{{ day }}</span>
                <div class="flex gap-2 flex-1">
                  <input
                    v-model="generalAvailability[index].startTime"
                    type="time"
                    class="input-field text-sm"
                    :disabled="!generalAvailability[index].available"
                  />
                  <span class="text-gray-500">to</span>
                  <input
                    v-model="generalAvailability[index].endTime"
                    type="time"
                    class="input-field text-sm"
                    :disabled="!generalAvailability[index].available"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unavailable Blocks Tab -->
    <div v-if="activeTab === 'unavailable'" class="space-y-6">
      <div class="flex gap-2 mb-4">
        <button
          @click="unavailableFilter = 'future'"
          :class="['btn-secondary text-sm', unavailableFilter === 'future' && 'ring-2 ring-sage-500']"
        >
<i class="fas fa-location-dot mr-1"></i>Future ({{ futureBlocks.length }})
        </button>
        <button
          @click="unavailableFilter = 'past'"
          :class="['btn-secondary text-sm', unavailableFilter === 'past' && 'ring-2 ring-sage-500']"
        >
          <i class="fas fa-check mr-1"></i>Past ({{ pastBlocks.length }})
        </button>
        <button
          @click="showAddBlockModal = true"
          class="btn-primary text-sm ml-auto"
        >
          <i class="fas fa-plus"></i>
          <span>Add Block</span>
        </button>
      </div>

      <!-- Future Blocks -->
      <div v-if="unavailableFilter === 'future' && futureBlocks.length > 0">
        <div class="space-y-3">
          <UnavailableBlockCard
            v-for="block in paginatedFutureBlocks"
            :key="block.id"
            :block="block"
            @edit="editBlock"
            @delete="deleteBlock"
          />
        </div>
        <Pagination v-model="futurePage" :total-pages="futureTotalPages" />
      </div>

      <!-- Past Blocks -->
      <div v-if="unavailableFilter === 'past' && pastBlocks.length > 0">
        <div class="space-y-3">
          <UnavailableBlockCard
            v-for="block in paginatedPastBlocks"
            :key="block.id"
            :block="block"
            :editable="false"
            @edit="editBlock"
            @delete="deleteBlock"
          />
        </div>
        <Pagination v-model="pastPage" :total-pages="pastTotalPages" />
      </div>

      <!-- Empty State -->
      <div v-if="(unavailableFilter === 'future' && futureBlocks.length === 0) || (unavailableFilter === 'past' && pastBlocks.length === 0)" class="card p-12 text-center">
        <p class="text-gray-500">
          {{ unavailableFilter === 'future' ? 'No upcoming unavailable blocks' : 'No past unavailable blocks' }}
        </p>
      </div>
    </div>

    <!-- Add/Edit Block Modal -->
    <UnavailableBlockModal
      v-if="showAddBlockModal || editingBlock"
      :block="editingBlock || undefined"
      @close="handleBlockModalClose"
      @saved="handleBlockSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useAvailabilityStore } from '@/stores/availability'
import { apiService } from '@/services/api'
import type { UnavailableBlock } from '@/types'
import UnavailableBlockCard from '@/components/UnavailableBlockCard.vue'
import UnavailableBlockModal from '@/components/UnavailableBlockModal.vue'
import Pagination from '@/components/Pagination.vue'

const availabilityStore = useAvailabilityStore()
const activeTab = ref<'general' | 'unavailable'>('general')
const unavailableFilter = ref<'future' | 'past'>('future')
const showAddBlockModal = ref(false)
const editingBlock = ref<UnavailableBlock | null>(null)

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// weekDays is Monday-first; the backend stores dayOfWeek as 0=Sun..6=Sat
const compIndexToDayOfWeek = (i: number) => (i === 6 ? 0 : i + 1)
const dayOfWeekToCompIndex = (d: number) => (d === 0 ? 6 : d - 1)

const generalAvailability = reactive([
  { available: true, startTime: '09:00', endTime: '18:00' }, // Monday
  { available: true, startTime: '09:00', endTime: '18:00' }, // Tuesday
  { available: true, startTime: '09:00', endTime: '18:00' }, // Wednesday
  { available: true, startTime: '09:00', endTime: '18:00' }, // Thursday
  { available: true, startTime: '09:00', endTime: '18:00' }, // Friday
  { available: true, startTime: '10:00', endTime: '16:00' }, // Saturday
  { available: false, startTime: '10:00', endTime: '16:00' }, // Sunday
])

const bufferMinutes = ref(30)
const slotIntervalMinutes = ref(30)
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const futureBlocks = computed(() => {
  const now = new Date()
  return availabilityStore.unavailableBlocks
    .filter(block => new Date(block.endDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
})

const pastBlocks = computed(() => {
  const now = new Date()
  return availabilityStore.unavailableBlocks
    .filter(block => new Date(block.endDate) <= now)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
})

const PAGE_SIZE = 10
const futurePage = ref(1)
const pastPage = ref(1)

const futureTotalPages = computed(() => Math.max(1, Math.ceil(futureBlocks.value.length / PAGE_SIZE)))
const pastTotalPages = computed(() => Math.max(1, Math.ceil(pastBlocks.value.length / PAGE_SIZE)))

const paginatedFutureBlocks = computed(() =>
  futureBlocks.value.slice((futurePage.value - 1) * PAGE_SIZE, futurePage.value * PAGE_SIZE)
)
const paginatedPastBlocks = computed(() =>
  pastBlocks.value.slice((pastPage.value - 1) * PAGE_SIZE, pastPage.value * PAGE_SIZE)
)

async function loadGeneralAvailability() {
  try {
    const [days, settings] = await Promise.all([
      apiService.getAllAvailability(),
      apiService.getAvailabilitySettings(),
    ])
    for (const d of days) {
      const idx = dayOfWeekToCompIndex(d.dayNumber)
      if (idx < 0 || idx > 6) continue
      generalAvailability[idx].available = d.isActive
      // Ignore the "00:00-00:00" placeholder rows used for inactive days
      if (d.startTime && d.startTime !== '00:00') generalAvailability[idx].startTime = d.startTime
      if (d.endTime && d.endTime !== '00:00') generalAvailability[idx].endTime = d.endTime
    }
    bufferMinutes.value = settings.bufferMinutes
    slotIntervalMinutes.value = settings.slotIntervalMinutes
  } catch (err: any) {
    saveError.value = err?.message || 'Failed to load availability'
  }
}

async function saveGeneralAvailability() {
  saving.value = true
  saveError.value = ''
  saveMessage.value = ''
  try {
    await Promise.all(
      generalAvailability.map((day, i) =>
        apiService.setAvailability({
          dayOfWeek: compIndexToDayOfWeek(i),
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: day.available,
        })
      )
    )
    await apiService.updateAvailabilitySettings({
      bufferMinutes: bufferMinutes.value,
      slotIntervalMinutes: slotIntervalMinutes.value,
    })
    saveMessage.value = 'Saved'
    setTimeout(() => (saveMessage.value = ''), 3000)
  } catch (err: any) {
    saveError.value = err?.message || 'Failed to save changes'
  } finally {
    saving.value = false
  }
}

function editBlock(block: UnavailableBlock) {
  editingBlock.value = block
}

async function deleteBlock(block: UnavailableBlock) {
  await availabilityStore.deleteUnavailableBlock(block.id)
}

function handleBlockModalClose() {
  showAddBlockModal.value = false
  editingBlock.value = null
}

async function handleBlockSaved(block: UnavailableBlock) {
  handleBlockModalClose()
  await availabilityStore.fetchUnavailableBlocks()
}

onMounted(() => {
  loadGeneralAvailability()
  availabilityStore.fetchUnavailableBlocks()
})
</script>
