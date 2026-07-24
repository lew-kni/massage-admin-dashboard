import axios, { AxiosInstance } from 'axios'
import type { AdminUser } from '@/stores/auth'
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
  BookingAssessment,
  BookingAssessmentInput,
  Expense,
  Receipt,
  ReceiptDetail,
} from '@/types'

class ApiService {
  private client: AxiosInstance

  // Set by the app on boot. Avoids importing the store here, which would create
  // a circular dependency (store -> api -> store).
  public onUnauthorized: (() => void) | null = null

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      // Send the httpOnly session cookie on every request. There is no bearer
      // token to attach — the browser handles credentials for us.
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // A 401 means the session expired or was revoked. Drop local state and
        // send them back to sign in — except on the probe itself, where 401 is
        // simply the expected "not signed in" answer.
        const url: string = error.config?.url || ''
        if (error.response?.status === 401 && !url.includes('/api/auth/me')) {
          this.onUnauthorized?.()
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

  // Auth
  async getCurrentUser(): Promise<AdminUser> {
    const { data } = await this.client.get('/api/auth/me')
    return data
  }

  async loginWithGoogle(credential: string): Promise<AdminUser> {
    const { data } = await this.client.post('/api/auth/google', { credential })
    return data
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout')
  }

  async logoutEverywhere(): Promise<void> {
    await this.client.post('/api/auth/logout-all')
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

  // Attach a promotion to an already-created booking, recomputing its price.
  async applyBookingPromotion(id: string, promotionId: string): Promise<Booking> {
    const { data } = await this.client.post(`/api/bookings/${id}/apply-promotion`, { promotionId })
    return data
  }

  // Apply a one-off manual discount to a booking -- a percentage or a flat
  // £ amount off, without creating a Promotion record for it.
  async applyBookingDiscount(id: string, payload: { discountPercentage: number } | { discountAmount: number }): Promise<Booking> {
    const { data } = await this.client.post(`/api/bookings/${id}/apply-discount`, payload)
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

  // Therapist's pre-massage assessment
  async getAssessment(id: string): Promise<BookingAssessment | null> {
    const { data } = await this.client.get(`/api/bookings/${id}/assessment`)
    return data
  }

  async saveAssessment(id: string, assessment: BookingAssessmentInput): Promise<BookingAssessment> {
    const { data } = await this.client.put(`/api/bookings/${id}/assessment`, assessment)
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

  async getAvailabilitySettings(): Promise<{ bufferMinutes: number; slotIntervalMinutes: number; maxAdvanceDays: number }> {
    const { data } = await this.client.get('/api/availability/settings')
    return data
  }

  async updateAvailabilitySettings(settings: { bufferMinutes?: number; slotIntervalMinutes?: number; maxAdvanceDays?: number }): Promise<{ bufferMinutes: number; slotIntervalMinutes: number; maxAdvanceDays: number }> {
    const { data } = await this.client.put('/api/availability/settings', settings)
    return data
  }

  // Dates in the range with no bookable slot for the given duration
  async getUnavailableDates(
    startDate: string,
    endDate: string,
    duration: number,
    excludeBookingId?: string
  ): Promise<{ dates: string[] }> {
    const { data } = await this.client.get('/api/availability/unavailable-dates', {
      params: { startDate, endDate, duration, ...(excludeBookingId ? { excludeBookingId } : {}) },
    })
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

  // Sends a real email through the current SMTP config -- the only reliable
  // way to check delivery is actually working, short of watching an inbox.
  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post('/api/emails/test-email', { to })
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

  // Soft-deleted leads (the admin's Trash view).
  async getDeletedLeads(): Promise<Lead[]> {
    const { data } = await this.client.get('/api/leads', { params: { trash: 'true' } })
    return data
  }

  async getLead(id: string): Promise<Lead> {
    const { data } = await this.client.get(`/api/leads/${id}`)
    return data
  }

  async updateLead(id: string, lead: Partial<Pick<Lead, 'isRead' | 'isSpam' | 'clientId'>>): Promise<Lead> {
    const { data } = await this.client.patch(`/api/leads/${id}`, lead)
    return data
  }

  async replyToLead(id: string, reply: { subject: string; body: string }): Promise<LeadReply> {
    const { data } = await this.client.post(`/api/leads/${id}/reply`, reply)
    return data
  }

  // Soft delete (default) — moves the lead to Trash so it can be restored.
  async deleteLead(id: string): Promise<void> {
    await this.client.delete(`/api/leads/${id}`)
  }

  // Permanent delete — only allowed once the lead is already in Trash.
  async permanentlyDeleteLead(id: string): Promise<void> {
    await this.client.delete(`/api/leads/${id}`, { params: { permanent: 'true' } })
  }

  async restoreLead(id: string): Promise<Lead> {
    const { data } = await this.client.post(`/api/leads/${id}/restore`)
    return data
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const { data } = await this.client.get('/api/expenses')
    return data
  }

  async getExpense(id: string): Promise<Expense> {
    const { data } = await this.client.get(`/api/expenses/${id}`)
    return data
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const { data } = await this.client.post('/api/expenses', expense)
    return data
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    const { data } = await this.client.patch(`/api/expenses/${id}`, expense)
    return data
  }

  async deleteExpense(id: string): Promise<void> {
    await this.client.delete(`/api/expenses/${id}`)
  }

  // Receipts
  async getReceipts(): Promise<Receipt[]> {
    const { data } = await this.client.get('/api/receipts')
    return data
  }

  async getReceipt(id: string): Promise<ReceiptDetail> {
    const { data } = await this.client.get(`/api/receipts/${id}`)
    return data
  }

  async getReceiptFileUrl(id: string): Promise<{ url: string }> {
    const { data } = await this.client.get(`/api/receipts/${id}/file`)
    return data
  }

  async createReceipt(payload: {
    file: File
    vendor?: string | null
    date?: string | null
    totalAmount?: number | null
    notes?: string | null
  }): Promise<Receipt> {
    const form = new FormData()
    form.append('file', payload.file)
    if (payload.vendor) form.append('vendor', payload.vendor)
    if (payload.date) form.append('date', payload.date)
    if (payload.totalAmount != null) form.append('totalAmount', String(payload.totalAmount))
    if (payload.notes) form.append('notes', payload.notes)
    const { data } = await this.client.post('/api/receipts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  async updateReceipt(id: string, receipt: Partial<Receipt>): Promise<Receipt> {
    const { data } = await this.client.patch(`/api/receipts/${id}`, receipt)
    return data
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.client.delete(`/api/receipts/${id}`)
  }

  // Create a new expense "under" a receipt — same shape as createExpense, the
  // receipt just pre-fills vendor/date server-side when omitted and the two
  // get linked automatically.
  async createExpenseUnderReceipt(
    receiptId: string,
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const { data } = await this.client.post(`/api/receipts/${receiptId}/expenses`, expense)
    return data
  }

  async linkExpenseToReceipt(receiptId: string, expenseId: string): Promise<void> {
    await this.client.post(`/api/receipts/${receiptId}/link`, { expenseId })
  }

  async unlinkExpenseFromReceipt(receiptId: string, expenseId: string): Promise<void> {
    await this.client.delete(`/api/receipts/${receiptId}/link/${expenseId}`)
  }
}

export const apiService = new ApiService()
