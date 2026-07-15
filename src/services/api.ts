import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import type {
  Client,
  Booking,
  Availability,
  BlockedTime,
  EmailTemplate,
  Communication,
} from '@/types'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth header to requests
    this.client.interceptors.request.use((config) => {
      const authStore = useAuthStore()
      if (authStore.apiKey) {
        config.headers['X-API-Key'] = authStore.apiKey
      }
      return config
    })

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const authStore = useAuthStore()
          authStore.logout()
        }

        // Convert API error responses to proper error messages
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join(', ')
          error.message = errorMessages
        }

        return Promise.reject(error)
      }
    )
  }

  // Clients
  async getClients(): Promise<Client[]> {
    const { data } = await this.client.get('/api/clients')
    return data
  }

  async getClient(id: string): Promise<Client> {
    const { data } = await this.client.get(`/api/clients/${id}`)
    return data
  }

  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const { data } = await this.client.post('/api/clients', client)
    return data
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    const { data } = await this.client.patch(`/api/clients/${id}`, client)
    return data
  }

  async deleteClient(id: string): Promise<void> {
    await this.client.delete(`/api/clients/${id}`)
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    const { data } = await this.client.get('/api/bookings')
    return data
  }

  async getBookingsForDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    const { data } = await this.client.get('/api/bookings/date-range', {
      params: { startDate, endDate },
    })
    return data
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const { data } = await this.client.post('/api/bookings', booking)
    return data
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<Booking> {
    const { data } = await this.client.patch(`/api/bookings/${id}`, booking)
    return data
  }

  async cancelBooking(id: string): Promise<Booking> {
    const { data } = await this.client.post(`/api/bookings/${id}/cancel`)
    return data
  }

  async deleteBooking(id: string): Promise<void> {
    await this.client.delete(`/api/bookings/${id}`)
  }

  // Availability
  async getAvailability(date: string): Promise<any> {
    const { data } = await this.client.get('/api/availability', {
      params: { date },
    })
    return data
  }

  async getAllAvailability(): Promise<Availability[]> {
    const { data } = await this.client.get('/api/availability/all')
    return data
  }

  async setAvailability(availability: Omit<Availability, 'id'>): Promise<Availability> {
    const { data } = await this.client.post('/api/availability/set-day', availability)
    return data
  }

  async blockTime(blockedTime: { startTime: string; endTime: string; reason?: string }): Promise<BlockedTime> {
    const { data } = await this.client.post('/api/availability/block-time', blockedTime)
    return data
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    const { data } = await this.client.get('/api/availability/blocked-times')
    return data
  }

  async removeBlockedTime(id: string): Promise<void> {
    await this.client.delete(`/api/availability/block-time/${id}`)
  }

  // Email Templates
  async getTemplates(): Promise<EmailTemplate[]> {
    const { data } = await this.client.get('/api/templates')
    return data
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    const { data } = await this.client.get(`/api/templates/${id}`)
    return data
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const { data } = await this.client.post('/api/templates', template)
    return data
  }

  async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data } = await this.client.patch(`/api/templates/${id}`, template)
    return data
  }

  async previewTemplate(id: string, variables: Record<string, string>): Promise<{ subject: string; body: string }> {
    const { data } = await this.client.post(`/api/templates/${id}/preview`, { variables })
    return data
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.client.delete(`/api/templates/${id}`)
  }

  // Communications
  async getCommunications(): Promise<Communication[]> {
    const { data } = await this.client.get('/api/communications')
    return data
  }

  async getClientCommunications(clientId: string): Promise<Communication[]> {
    const { data } = await this.client.get(`/api/communications/client/${clientId}`)
    return data
  }

  async sendEmail(payload: { clientId: string; subject: string; body: string; draftId?: string }): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post('/api/communications/send', payload)
    return data
  }

  async createDraft(payload: { clientId: string; templateId: string; variables?: Record<string, string> }): Promise<Communication> {
    const { data } = await this.client.post('/api/communications/draft', payload)
    return data
  }

  async updateCommunication(id: string, communication: Partial<Communication>): Promise<Communication> {
    const { data } = await this.client.patch(`/api/communications/${id}`, communication)
    return data
  }

  async deleteCommunication(id: string): Promise<void> {
    await this.client.delete(`/api/communications/${id}`)
  }
}

export const apiService = new ApiService()
