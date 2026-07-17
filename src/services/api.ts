import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import type {
  Client,
  Booking,
  Availability,
  BlockedTime,
  EmailTemplate,
  Communication,
  Service,
  ServiceDuration,
  Promotion,
  Lead,
  LeadReply,
  AppSettings,
  IntakeForm,
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

  // Revoke the applied promotion from a booking (reverts to full list price)
  async removeBookingPromotion(id: string): Promise<Booking> {
    const { data } = await this.client.post(`/api/bookings/${id}/remove-promotion`)
    return data
  }

  // Pre-visit intake form
  async sendPreForm(id: string): Promise<Booking> {
    const { data } = await this.client.post(`/api/bookings/${id}/send-preform`)
    return data
  }
  async getPreFormLink(id: string): Promise<{ token: string; url: string }> {
    const { data } = await this.client.post(`/api/bookings/${id}/preform-link`)
    return data
  }
  async getIntake(id: string): Promise<IntakeForm | null> {
    const { data } = await this.client.get(`/api/bookings/${id}/intake`)
    return data
  }

  // Availability
  async getAvailability(date: string): Promise<any> {
    const { data } = await this.client.get('/api/availability', {
      params: { date },
    })
    return data
  }

  async getAllAvailability(): Promise<any[]> {
    const { data } = await this.client.get('/api/availability/all')
    return data
  }

  async setAvailability(availability: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }): Promise<Availability> {
    const { data } = await this.client.post('/api/availability/set-day', availability)
    return data
  }

  async getAvailabilitySettings(): Promise<{ bufferMinutes: number; slotIntervalMinutes: number }> {
    const { data } = await this.client.get('/api/availability/settings')
    return data
  }

  async updateAvailabilitySettings(settings: { bufferMinutes?: number; slotIntervalMinutes?: number }): Promise<{ bufferMinutes: number; slotIntervalMinutes: number }> {
    const { data } = await this.client.put('/api/availability/settings', settings)
    return data
  }

  async getSlots(date: string, duration: number): Promise<{ available: boolean; slots: string[]; reason?: string; blocks?: Array<{ start: string; end: string; reason: string | null }> }> {
    const { data } = await this.client.get('/api/availability/slots', { params: { date, duration } })
    return data
  }

  // App settings
  async getSettings(): Promise<AppSettings> {
    const { data } = await this.client.get('/api/settings')
    return data
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const { data } = await this.client.put('/api/settings', settings)
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

  // Services
  async getServices(): Promise<Service[]> {
    // ?all=true returns inactive services/durations too (admin only)
    const { data } = await this.client.get('/api/services', { params: { all: true } })
    return data
  }

  async createService(service: Partial<Service> & { durations?: ServiceDuration[] }): Promise<Service> {
    const { data } = await this.client.post('/api/services', service)
    return data
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const { data } = await this.client.patch(`/api/services/${id}`, service)
    return data
  }

  async deleteService(id: string): Promise<void> {
    await this.client.delete(`/api/services/${id}`)
  }

  async upsertServiceDuration(serviceId: string, duration: ServiceDuration): Promise<Service> {
    const { data } = await this.client.put(`/api/services/${serviceId}/durations`, duration)
    return data
  }

  async deleteServiceDuration(serviceId: string, durationId: string): Promise<void> {
    await this.client.delete(`/api/services/${serviceId}/durations/${durationId}`)
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    const { data } = await this.client.get('/api/promotions', { params: { all: true } })
    return data
  }

  // Single promotion including the bookings that used it
  async getPromotion(id: string): Promise<Promotion> {
    const { data } = await this.client.get(`/api/promotions/${id}`, { params: { all: true } })
    return data
  }

  async createPromotion(promotion: Partial<Promotion>): Promise<Promotion> {
    const { data } = await this.client.post('/api/promotions', promotion)
    return data
  }

  async updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion> {
    const { data } = await this.client.patch(`/api/promotions/${id}`, promotion)
    return data
  }

  async deletePromotion(id: string): Promise<void> {
    await this.client.delete(`/api/promotions/${id}`)
  }

  // Leads
  async getLeads(clientId?: string): Promise<Lead[]> {
    const { data } = await this.client.get('/api/leads', { params: clientId ? { clientId } : undefined })
    return data
  }

  async getLead(id: string): Promise<Lead> {
    const { data } = await this.client.get(`/api/leads/${id}`)
    return data
  }

  async updateLead(id: string, lead: Partial<Pick<Lead, 'isRead' | 'clientId'>>): Promise<Lead> {
    const { data } = await this.client.patch(`/api/leads/${id}`, lead)
    return data
  }

  async replyToLead(id: string, reply: { subject: string; body: string }): Promise<LeadReply> {
    const { data } = await this.client.post(`/api/leads/${id}/reply`, reply)
    return data
  }
}

export const apiService = new ApiService()
