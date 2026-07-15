<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Bookings</h1>
      <p class="text-gray-600 mt-2">Manage massage therapy appointments</p>
    </div>

    <!-- View Tabs -->
    <div class="flex gap-2 mb-8 border-b">
      <button
        @click="viewMode = 'list'"
        :class="['px-4 py-3 font-medium border-b-2', viewMode === 'list' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        📋 List
      </button>
      <button
        @click="viewMode = 'calendar'"
        :class="['px-4 py-3 font-medium border-b-2', viewMode === 'calendar' ? 'border-sage-600 text-sage-600' : 'border-transparent text-gray-600']"
      >
        📅 Calendar View
      </button>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'">
      <!-- Status Filters -->
      <div class="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div class="flex gap-2 flex-wrap">
          <button
            @click="filterStatus = 'PENDING'"
            :class="['btn-secondary text-sm', filterStatus === 'PENDING' && 'ring-2 ring-sage-500']"
          >
            Pending ({{ bookingsStore.bookings.filter(b => b.status === 'PENDING').length }})
          </button>
          <button
            @click="filterStatus = 'CONFIRMED'"
            :class="['btn-secondary text-sm', filterStatus === 'CONFIRMED' && 'ring-2 ring-sage-500']"
          >
            Confirmed ({{ bookingsStore.bookings.filter(b => b.status === 'CONFIRMED').length }})
          </button>
          <button
            @click="filterStatus = 'CANCELLED'"
            :class="['btn-secondary text-sm', filterStatus === 'CANCELLED' && 'ring-2 ring-sage-500']"
          >
            Rejected ({{ bookingsStore.bookings.filter(b => b.status === 'CANCELLED').length }})
          </button>
          <button
            @click="filterStatus = null"
            :class="['btn-secondary text-sm', filterStatus === null && 'ring-2 ring-sage-500']"
          >
            All
          </button>
        </div>

        <!-- View Toggle -->
        <div class="flex gap-1 bg-gray-200 rounded p-1">
          <button
            @click="listDisplayMode = 'cards'"
            :class="['px-3 py-1 rounded text-sm font-medium transition', listDisplayMode === 'cards' ? 'bg-white text-sage-600 shadow' : 'text-gray-600 hover:text-gray-700']"
          >
            📇 Cards
          </button>
          <button
            @click="listDisplayMode = 'table'"
            :class="['px-3 py-1 rounded text-sm font-medium transition', listDisplayMode === 'table' ? 'bg-white text-sage-600 shadow' : 'text-gray-600 hover:text-gray-700']"
          >
            📊 Table
          </button>
        </div>
      </div>

      <div class="mb-6"></div>

      <!-- Loading State -->
      <div v-if="bookingsStore.loading" class="card p-8 text-center">
        <p class="text-gray-500">Loading bookings...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="bookingsStore.error" class="card p-8 bg-red-50 border-red-200">
        <p class="text-red-700">{{ bookingsStore.error }}</p>
      </div>

      <!-- Bookings Display -->
      <div v-else>
        <!-- Card View -->
        <div v-if="listDisplayMode === 'cards'" class="space-y-6">
          <!-- Pending Bookings (grouped) -->
          <div v-if="pendingBookings.length > 0 && (!filterStatus || filterStatus === 'PENDING')">
            <h2 class="text-lg font-semibold text-orange-600 mb-3">⏳ Pending Review ({{ pendingBookings.length }})</h2>
            <div class="space-y-3">
              <BookingCard
                v-for="booking in pendingBookings"
                :key="booking.id"
                :booking="booking"
                :pending="true"
                @confirm="confirmBooking"
                @reject="rejectBooking"
                @edit="editBooking"
              />
            </div>
          </div>

          <!-- Confirmed Bookings (by date) -->
          <div v-if="confirmedBookings.length > 0 && (!filterStatus || filterStatus === 'CONFIRMED')">
            <h2 class="text-lg font-semibold text-green-600 mb-3">✓ Confirmed ({{ confirmedBookings.length }})</h2>
            <div class="space-y-3">
              <BookingCard
                v-for="booking in confirmedBookings"
                :key="booking.id"
                :booking="booking"
                :pending="false"
                @cancel="cancelBooking"
                @edit="editBooking"
              />
            </div>
          </div>

          <!-- Rejected Bookings -->
          <div v-if="rejectedBookings.length > 0 && (!filterStatus || filterStatus === 'CANCELLED')">
            <h2 class="text-lg font-semibold text-red-600 mb-3">✕ Rejected ({{ rejectedBookings.length }})</h2>
            <div class="space-y-3">
              <BookingCard
                v-for="booking in rejectedBookings"
                :key="booking.id"
                :booking="booking"
                :pending="false"
                @cancel="cancelBooking"
                @edit="editBooking"
              />
            </div>
          </div>

          <!-- No Bookings -->
          <div v-if="filteredBookings.length === 0" class="card p-12 text-center">
            <p class="text-gray-500">
              {{ filterStatus ? `No ${filterStatus.toLowerCase()} bookings` : 'No bookings yet' }}
            </p>
          </div>
        </div>

        <!-- Table View -->
        <div v-else class="space-y-4">
          <BookingTableView
            :bookings="paginatedBookings"
            :filter-status="filterStatus"
            @confirm="confirmBooking"
            @reject="rejectBooking"
            @cancel="cancelBooking"
            @edit="editBooking"
          />

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div class="text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="space-y-6">
      <!-- Calendar View Toggle -->
      <div class="flex gap-1 bg-gray-200 rounded p-1 w-fit">
        <button
          @click="calendarViewMode = '1d'"
          :class="['px-3 py-1 rounded text-sm font-medium transition', calendarViewMode === '1d' ? 'bg-white text-sage-600 shadow' : 'text-gray-600 hover:text-gray-700']"
        >
          1d Day
        </button>
        <button
          @click="calendarViewMode = '7d'"
          :class="['px-3 py-1 rounded text-sm font-medium transition', calendarViewMode === '7d' ? 'bg-white text-sage-600 shadow' : 'text-gray-600 hover:text-gray-700']"
        >
          7d Week
        </button>
        <button
          @click="calendarViewMode = '30d'"
          :class="['px-3 py-1 rounded text-sm font-medium transition', calendarViewMode === '30d' ? 'bg-white text-sage-600 shadow' : 'text-gray-600 hover:text-gray-700']"
        >
          30d Month
        </button>
      </div>

      <!-- 1d Timeline View (Google Calendar Style) -->
      <div v-if="calendarViewMode === '1d'" class="space-y-4">
        <!-- Navigation controls -->
        <div class="flex items-center gap-4">
          <button @click="goToPreviousDay" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
            ← Prev Day
          </button>
          <button @click="goToToday" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 font-medium">
            Today
          </button>
          <button @click="goToNextDay" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next Day →
          </button>
          <label class="text-sm font-medium text-gray-700 ml-4">Select Date:</label>
          <input
            :value="selectedCalendarDate.toISOString().split('T')[0]"
            @input="selectedCalendarDate = new Date($event.target.value + 'T00:00:00')"
            type="date"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <span v-if="isToday(selectedCalendarDate)" class="text-xs text-blue-600 font-medium">● Today</span>
        </div>

        <div class="card overflow-hidden">
          <div class="flex bg-gray-50 border-b">
            <!-- Time column header -->
            <div class="w-20 p-3 bg-white font-semibold text-xs text-gray-700 text-center border-r">Time</div>
            <!-- Schedule column header -->
            <div class="flex-1 p-3 font-semibold text-xs text-gray-700">Schedule</div>
          </div>

          <!-- Timeline grid -->
          <div class="relative border-t">
            <!-- Time slots with fixed height (60px per hour) -->
            <div v-for="hour in timeSlots" :key="'slot-' + hour" class="flex border-b" style="min-height: 60px;">
              <!-- Time label -->
              <div class="w-20 p-2 bg-gray-50 text-xs font-medium text-gray-600 text-center border-r flex items-start justify-center pt-1">
                {{ formatHourLabel(hour) }}
              </div>

              <!-- Time slot container - relative for positioning -->
              <div class="flex-1 relative bg-white">
                <!-- Unavailable block for this hour -->
                <div v-if="hasUnavailableAt(hour)" class="absolute inset-0 bg-red-50 border-l-4 border-red-500 flex items-center pl-2">
                  <span class="text-xs text-red-700 font-medium">🔒</span>
                </div>
              </div>
            </div>

            <!-- Current time indicator line (only show if today) -->
            <div v-if="isToday(selectedCalendarDate)" class="absolute left-0 right-0 pointer-events-none" :style="`top: ${currentTimePosition}px;`">
              <div class="flex items-center h-1">
                <div class="w-20 bg-blue-600 h-1"></div>
                <div class="flex-1 bg-blue-600 h-1"></div>
                <div class="w-2 h-2 bg-blue-600 rounded-full absolute right-0 -translate-y-0.5"></div>
              </div>
            </div>

            <!-- Overlay layer for bookings (positioned absolutely) -->
            <div class="absolute inset-0 pointer-events-none">
              <div v-for="booking in todayBookings" :key="booking.id" class="absolute left-20 right-0 pointer-events-auto" :style="getBookingStyle(booking)">
                <div
                  class="h-full rounded border-l-4 p-2 cursor-pointer hover:opacity-80 transition overflow-hidden"
                  :class="[getBookingBg(booking.status), getBookingBorder(booking.status)]"
                  @click="editBooking(booking)"
                >
                  <div class="font-semibold text-xs text-gray-900">{{ booking.client.firstName }} {{ booking.client.lastName }}</div>
                  <div class="text-xs text-gray-700">{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</div>
                  <div class="text-xs text-gray-600 mt-1">{{ booking.service }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="todayBookings.length === 0 && dayUnavailableBlocks.length === 0" class="p-8 text-center text-gray-500">
            <p class="text-sm">No bookings scheduled for this day</p>
          </div>
        </div>
      </div>

      <!-- 7d Week View -->
      <div v-else-if="calendarViewMode === '7d'" class="space-y-4">
        <!-- Navigation controls -->
        <div class="flex items-center gap-4">
          <button @click="goToPreviousWeek" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
            ← Prev Week
          </button>
          <button @click="goToToday" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 font-medium">
            Today
          </button>
          <button @click="goToNextWeek" class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next Week →
          </button>
        </div>

        <div class="card overflow-x-auto">
          <!-- Week header with days -->
          <div class="flex bg-gray-50 border-b min-w-max">
            <div class="w-20 p-3 bg-white font-semibold text-xs text-gray-700 text-center border-r">Time</div>
            <div v-for="(day, idx) in getWeekDays()" :key="'weekday-' + idx" class="flex-1 p-3 text-center border-r min-w-32" :class="{ 'bg-blue-50 border-b-4 border-blue-500': isToday(day) }">
              <div class="font-semibold text-xs" :class="{ 'text-blue-700': isToday(day), 'text-gray-700': !isToday(day) }">{{ formatDayName(day) }}</div>
              <div class="text-xs" :class="{ 'text-blue-600 font-medium': isToday(day), 'text-gray-500': !isToday(day) }">{{ formatDateShort(day) }}</div>
            </div>
          </div>

        <!-- Week timeline grid -->
        <div class="flex min-w-max relative">
          <!-- Time column -->
          <div class="w-20 bg-gray-50 border-r divide-y">
            <div v-for="hour in timeSlots" :key="'time-' + hour" class="p-2 text-xs font-medium text-gray-600 text-center" style="min-height: 60px; display: flex; align-items: flex-start; justify-content: center; padding-top: 2px;">
              {{ formatHourLabel(hour) }}
            </div>
          </div>

          <!-- Days columns -->
          <div v-for="(day, dayIdx) in getWeekDays()" :key="'weekcol-' + dayIdx" class="flex-1 min-w-32 border-r divide-y relative">
            <div v-for="hour in timeSlots" :key="'slot-' + dayIdx + '-' + hour" class="bg-white relative" style="min-height: 60px;">
              <!-- Unavailable blocks -->
              <div v-if="hasUnavailableAtDay(day, hour)" class="absolute inset-0 bg-red-50 border-l-4 border-red-500 flex items-center pl-1">
                <span class="text-xs text-red-700 font-medium">🔒</span>
              </div>
            </div>

            <!-- Overlay for bookings -->
            <div class="absolute inset-0 pointer-events-none">
              <div v-for="booking in getBookingsForDay(day)" :key="booking.id" class="absolute left-0 right-0 pointer-events-auto" :style="getWeekBookingStyle(booking, day)">
                <div
                  class="text-xs p-1 rounded border-l-4 cursor-pointer hover:opacity-80 transition overflow-hidden mx-1"
                  :class="[getBookingBg(booking.status), getBookingBorder(booking.status)]"
                  @click="editBooking(booking)"
                  :title="booking.client.firstName + ' ' + booking.client.lastName + ' - ' + booking.service"
                >
                  <div class="font-semibold truncate">{{ booking.client.firstName }}</div>
                  <div class="text-xs truncate">{{ formatTime(booking.startTime) }}</div>
                </div>
              </div>
            </div>

            <!-- Current time indicator (only if current week) -->
            <div v-if="isToday(day)" class="absolute left-0 right-0 pointer-events-none" :style="`top: ${currentTimePosition}px;`">
              <div class="h-1 bg-blue-600 relative">
                <div class="w-2 h-2 bg-blue-600 rounded-full absolute -left-1 -top-0.5"></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 30d Month View -->
      <div v-else class="card p-6">
        <!-- Month header -->
        <div class="flex items-center justify-between mb-6">
          <div class="text-lg font-semibold text-gray-900">
            {{ getMonthYear(selectedCalendarDate) }}
          </div>
          <div class="flex gap-2">
            <button
              @click="goToPreviousMonth"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              ← Prev
            </button>
            <button
              @click="goToNextMonth"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>

        <!-- Month grid -->
        <div class="grid grid-cols-7 gap-1 bg-gray-200 p-1 rounded">
          <!-- Day headers -->
          <div v-for="dayName in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="dayName" class="p-2 text-center font-semibold text-xs text-gray-700 bg-gray-50 rounded">
            {{ dayName }}
          </div>

          <!-- Day cells -->
          <div v-for="(day, idx) in getMonthDays()" :key="'monthday-' + idx" class="bg-white p-2 rounded min-h-28 relative" :class="{ 'bg-gray-50': !isCurrentMonth(day) }">
            <!-- Date number -->
            <div class="text-xs font-semibold mb-1" :class="isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'">
              {{ day.getDate() }}
            </div>

            <!-- Bookings for this day -->
            <div class="space-y-1">
              <div
                v-for="booking in getBookingsForDay(day)"
                :key="booking.id"
                class="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition truncate"
                :class="getBookingBg(booking.status)"
                @click="editBooking(booking)"
                :title="booking.client.firstName + ' - ' + booking.service"
              >
                {{ booking.client.firstName }}
              </div>

              <!-- Unavailable indicators -->
              <div v-if="hasUnavailableDay(day)" class="text-xs p-1 rounded bg-red-50 text-red-700 font-medium truncate">
                🔒 Blocked
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Side Panel (Calendar View) -->
    <BookingSidePanel
      :booking="selectedBooking"
      @close="selectedBooking = null"
      @cancel="cancelBooking"
    />

    <!-- Edit Booking Modal -->
    <BookingModal
      v-if="editingBooking"
      :booking="editingBooking"
      @close="editingBooking = null"
      @saved="handleBookingSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import { useAvailabilityStore } from '@/stores/availability'
import type { Booking } from '@/types'
import BookingCard from '@/components/BookingCard.vue'
import BookingTableView from '@/components/BookingTableView.vue'
import BookingModal from '@/components/BookingModal.vue'
import BookingSidePanel from '@/components/BookingSidePanel.vue'

const router = useRouter()
const bookingsStore = useBookingsStore()
const availabilityStore = useAvailabilityStore()
const viewMode = ref<'list' | 'calendar'>('list')
const listDisplayMode = ref<'cards' | 'table'>('table')
const calendarViewMode = ref<'1d' | '7d' | '30d'>('1d')
const filterStatus = ref<'PENDING' | 'CONFIRMED' | 'CANCELLED' | null>(null)
const editingBooking = ref<Booking | null>(null)
const selectedBooking = ref<Booking | null>(null)
const currentPage = ref(1)
const itemsPerPage = 10
const selectedCalendarDate = ref(new Date())
const timeSlots = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

const filteredBookings = computed(() => {
  if (!filterStatus.value) return bookingsStore.bookings
  return bookingsStore.bookings.filter(b => b.status === filterStatus.value)
})

const displayBookings = computed(() => {
  return filteredBookings.value.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const totalPages = computed(() => Math.ceil(displayBookings.value.length / itemsPerPage))

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return displayBookings.value.slice(start, end)
})

const pendingBookings = computed(() => {
  return bookingsStore.bookings
    .filter(b => b.status === 'PENDING')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const confirmedBookings = computed(() => {
  return bookingsStore.bookings
    .filter(b => b.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const rejectedBookings = computed(() => {
  return bookingsStore.bookings
    .filter(b => b.status === 'CANCELLED')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
})

const unavailableBlocks = computed(() => {
  return availabilityStore.unavailableBlocks
})

const todayBookings = computed(() => {
  const today = new Date(selectedCalendarDate.value)
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return bookingsStore.bookings.filter(b => {
    const bookingStart = new Date(b.startTime)
    return bookingStart >= startOfDay && bookingStart < endOfDay
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const dayUnavailableBlocks = computed(() => {
  const today = new Date(selectedCalendarDate.value)
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return unavailableBlocks.value.filter(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < endOfDay && blockEnd > startOfDay
  })
})

function formatHourLabel(hour: number): string {
  if (hour < 12) return `${hour}a`
  if (hour === 12) return '12p'
  return `${hour - 12}p`
}

function bookingOccupiesHour(booking: Booking, hour: number): boolean {
  const bookingStart = new Date(booking.startTime)
  const bookingEnd = new Date(booking.endTime)
  return bookingStart.getHours() <= hour && bookingEnd.getHours() > hour
}

function hasUnavailableAt(hour: number): boolean {
  const today = new Date(selectedCalendarDate.value)
  const hourStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour)
  const hourEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour + 1)

  return dayUnavailableBlocks.value.some(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < hourEnd && blockEnd > hourStart
  })
}

function getBookingBorder(status: string): string {
  if (status === 'PENDING') return 'border-l-4 border-orange-500'
  if (status === 'CONFIRMED') return 'border-l-4 border-green-500'
  if (status === 'CANCELLED') return 'border-l-4 border-red-500'
  return 'border-l-4 border-gray-500'
}

function getBookingBg(status: string): string {
  if (status === 'PENDING') return 'bg-orange-50'
  if (status === 'CONFIRMED') return 'bg-green-50'
  if (status === 'CANCELLED') return 'bg-red-50'
  return 'bg-gray-50'
}

function getStatusIcon(status: string): string {
  if (status === 'PENDING') return '⏳'
  if (status === 'CONFIRMED') return '✓'
  if (status === 'CANCELLED') return '✕'
  return '•'
}

function getBookingsForHour(hour: number): Booking[] {
  return todayBookings.value.filter(booking => {
    const start = new Date(booking.startTime)
    const end = new Date(booking.endTime)
    return start.getHours() <= hour && end.getHours() > hour
  })
}

function formatTime(date: string): string {
  const d = new Date(date)
  const hours = d.getHours()
  const mins = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12
  return `${hour12}:${mins}${ampm}`
}

function getBookingStyle(booking: Booking): string {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const today = new Date(selectedCalendarDate.value)
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 5, 0, 0)

  // Calculate minutes from 5am (start of day)
  const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (dayStart.getHours() * 60 + dayStart.getMinutes())
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

  // Each hour is 60px, so 1 minute = 1px
  const topPx = startMinutes
  const heightPx = durationMinutes

  return `top: ${topPx}px; height: ${heightPx}px;`
}

// Week view helper functions
function getWeekDays(): Date[] {
  const start = new Date(selectedCalendarDate.value)
  const day = start.getDay()
  const diff = start.getDate() - day
  const weekStart = new Date(start.setDate(diff))

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    days.push(date)
  }
  return days
}

function formatDayName(date: Date): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return dayNames[date.getDay()]
}

function formatDateShort(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}/${day}`
}

function hasUnavailableAtDay(date: Date, hour: number): boolean {
  const hourStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour)
  const hourEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1)

  return unavailableBlocks.value.some(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < hourEnd && blockEnd > hourStart
  })
}

function getBookingsForDay(date: Date): Booking[] {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

  return bookingsStore.bookings.filter(b => {
    const bookingStart = new Date(b.startTime)
    return bookingStart >= startOfDay && bookingStart < endOfDay
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

function getWeekBookingStyle(booking: Booking, date: Date): string {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 5, 0, 0)

  // Calculate minutes from 5am
  const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (dayStart.getHours() * 60 + dayStart.getMinutes())
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

  const topPx = startMinutes
  const heightPx = durationMinutes

  return `top: ${topPx}px; height: ${heightPx}px;`
}

// Month view helper functions
function getMonthDays(): Date[] {
  const year = selectedCalendarDate.value.getFullYear()
  const month = selectedCalendarDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days: Date[] = []
  const current = new Date(startDate)

  while (days.length < 42) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

function isCurrentMonth(date: Date): boolean {
  return date.getMonth() === selectedCalendarDate.value.getMonth()
}

function goToPreviousMonth() {
  const prev = new Date(selectedCalendarDate.value)
  prev.setMonth(prev.getMonth() - 1)
  selectedCalendarDate.value = prev
}

function goToNextMonth() {
  const next = new Date(selectedCalendarDate.value)
  next.setMonth(next.getMonth() + 1)
  selectedCalendarDate.value = next
}

function getMonthYear(date: Date): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

function hasUnavailableDay(date: Date): boolean {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

  return unavailableBlocks.value.some(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < endOfDay && blockEnd > startOfDay
  })
}

// Current time and navigation helpers
function isToday(date: Date): boolean {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
}

const currentTimePosition = computed(() => {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0)
  const minutesFromStart = (now.getHours() * 60 + now.getMinutes()) - (dayStart.getHours() * 60 + dayStart.getMinutes())
  return Math.max(0, minutesFromStart)
})

function goToToday() {
  selectedCalendarDate.value = new Date()
}

function goToPreviousDay() {
  const prev = new Date(selectedCalendarDate.value)
  prev.setDate(prev.getDate() - 1)
  selectedCalendarDate.value = prev
}

function goToNextDay() {
  const next = new Date(selectedCalendarDate.value)
  next.setDate(next.getDate() + 1)
  selectedCalendarDate.value = next
}

function goToPreviousWeek() {
  const prev = new Date(selectedCalendarDate.value)
  prev.setDate(prev.getDate() - 7)
  selectedCalendarDate.value = prev
}

function goToNextWeek() {
  const next = new Date(selectedCalendarDate.value)
  next.setDate(next.getDate() + 7)
  selectedCalendarDate.value = next
}

async function confirmBooking(booking: Booking) {
  await bookingsStore.updateBooking(booking.id, { status: 'CONFIRMED' })
}

async function rejectBooking(booking: Booking) {
  await bookingsStore.updateBooking(booking.id, { status: 'CANCELLED' })
}

async function cancelBooking(booking: Booking) {
  await bookingsStore.updateBooking(booking.id, { status: 'CANCELLED' })
}

function editBooking(booking: Booking) {
  if (viewMode.value === 'list') {
    // Navigate to booking detail page in list view
    router.push(`/bookings/${booking.id}`)
  } else {
    // Open side panel in calendar view
    selectedBooking.value = booking
  }
}

function handleBookingSaved() {
  editingBooking.value = null
}

watch(filterStatus, () => {
  currentPage.value = 1
})

onMounted(() => {
  bookingsStore.fetchBookings()
  availabilityStore.fetchUnavailableBlocks()
})
</script>
