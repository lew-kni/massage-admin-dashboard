// Client Types
export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth?: string | null
  address?: string | null
  city?: string | null
  postcode?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

// Booking Types
export interface Booking {
  id: string
  bookingNumber: number
  clientId: string
  client?: Client
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  service?: string | null
  notes?: string | null
  preFormStatus: 'NOT_SENT' | 'SENT' | 'COMPLETED' | 'OVERDUE'
  preFormSentAt?: string | null
  preFormCompletedAt?: string | null
  createdAt: string
  updatedAt: string
}

// Availability Types
export interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface BlockedTime {
  id: string
  startTime: string
  endTime: string
  reason?: string | null
  createdAt: string
}

export interface UnavailableBlock {
  id: string
  startDate: string
  endDate: string
  startTime?: string | null
  endTime?: string | null
  reason?: string | null
  createdAt: string
  updatedAt: string
}

// Email Template Types
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'WELCOME' | 'REMINDER_24H' | 'CONFIRMATION' | 'CANCELLATION' | 'CUSTOM'
  variables?: string[] | null
  createdAt: string
  updatedAt: string
}

// Communication Types
export interface Communication {
  id: string
  clientId: string
  client?: Client
  templateId?: string | null
  template?: EmailTemplate | null
  subject: string
  body: string
  toEmail: string
  status: 'DRAFT' | 'SENT' | 'FAILED'
  sentAt: string
  sentBy: string
}

// Document Types
export interface Document {
  id: string
  clientId: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  docType: 'PRE_APPOINTMENT' | 'POST_APPOINTMENT' | 'ASSESSMENT' | 'OTHER'
  uploadedAt: string
}

// Assessment Types
export interface Assessment {
  id: string
  clientId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// Auth Types
export interface AuthStore {
  apiKey: string | null
  isAuthenticated: boolean
  login(apiKey: string): void
  logout(): void
}
