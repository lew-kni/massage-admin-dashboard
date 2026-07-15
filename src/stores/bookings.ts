import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Booking } from '@/types'

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref<Booking[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBookings() {
    loading.value = true
    error.value = null
    try {
      bookings.value = await apiService.getBookings()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch bookings'
    } finally {
      loading.value = false
    }
  }

  async function fetchBookingsForDateRange(startDate: string, endDate: string) {
    loading.value = true
    error.value = null
    try {
      return await apiService.getBookingsForDateRange(startDate, endDate)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch bookings'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      const newBooking = await apiService.createBooking(booking)
      bookings.value.push(newBooking)
      return newBooking
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBooking(id: string, booking: Partial<Booking>) {
    loading.value = true
    error.value = null
    try {
      const updated = await apiService.updateBooking(id, booking)
      const index = bookings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        bookings.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelBooking(id: string) {
    loading.value = true
    error.value = null
    try {
      const updated = await apiService.cancelBooking(id)
      const index = bookings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        bookings.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to cancel booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBooking(id: string) {
    loading.value = true
    error.value = null
    try {
      await apiService.deleteBooking(id)
      bookings.value = bookings.value.filter(b => b.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    fetchBookingsForDateRange,
    createBooking,
    updateBooking,
    cancelBooking,
    deleteBooking,
  }
})
