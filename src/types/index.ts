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

// Lead Types
export interface LeadReply {
  id: string
  leadId: string
  subject: string
  body: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  service: string | null
  location: string | null
  message: string
  healthNotes: string | null
  isRead: boolean
  clientId: string | null
  client?: Client | null
  replies?: LeadReply[]
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
  postcode?: string | null
  healthConditions?: string | null
  problemAreas?: string | null
  pressurePreference?: 'gentle' | 'medium' | 'firm' | null
  firstTime?: boolean | null
  allergies?: string | null
  promotionId?: string | null
  promotion?: Promotion | null
  // Pricing captured at booking time (whole GBP). `discountedPrice` is the
  // promotion-adjusted price; null when no promotion applied.
  price?: number | null
  discountedPrice?: number | null
  preFormToken?: string | null
  preFormStatus: 'NOT_SENT' | 'SENT' | 'COMPLETED' | 'OVERDUE'
  preFormSentAt?: string | null
  preFormCompletedAt?: string | null
  isPaid?: boolean | null
  paymentMethod?: 'CASH' | 'BACS' | null
  createdAt: string
  updatedAt: string
}

// Pre-visit intake form
export interface BodyMarker {
  view: 'front' | 'back'
  x: number
  y: number
  type: 'pain' | 'tension' | 'injury' | 'avoid'
  note?: string
}

export interface IntakeForm {
  id: string
  bookingId: string
  fullName?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  occupation?: string | null
  phone?: string | null
  address?: string | null
  emergencyName?: string | null
  emergencyPhone?: string | null
  emergencyRelationship?: string | null
  gpName?: string | null
  gpPhone?: string | null
  gpSurgery?: string | null
  hasContraindications?: boolean | null
  contraindicationDetails?: string | null
  contraindicationFlags?: string[]
  visitedGpRecently?: boolean | null
  gpVisitDetails?: string | null
  gpPermissionGiven?: boolean | null
  currentMedications?: string | null
  reasonForVisit?: string | null
  subjectiveHistory?: string | null
  bodyDiagram?: BodyMarker[]
  consentAccurate?: boolean
  consentProceed?: boolean
  signatureName?: string | null
  signedAt?: string | null
  completedBy?: 'CLIENT' | 'THERAPIST' | null
  completedInPerson?: boolean
  submittedAt?: string | null
}

// Therapist's pre-massage assessment (the paper palpation/observation sheet)
export interface AssessmentFinding {
  id?: string
  bodyPart: string
  side?: 'LEFT' | 'RIGHT' | 'BOTH' | 'N/A' | null
  muscles: string[]
  source: 'OBSERVED' | 'REPORTED'
  posture?: string | null
  movement?: string | null
  palpation?: string | null
  functionalScale?: number | null
  notes?: string | null
  sortOrder?: number
}

export interface BookingAssessment {
  id: string
  bookingId: string
  clinicalFindings?: string | null
  proposedAction?: string | null
  generalNotes?: string | null
  findings: AssessmentFinding[]
  createdAt: string
  updatedAt: string
}

export interface BookingAssessmentInput {
  clinicalFindings?: string | null
  proposedAction?: string | null
  generalNotes?: string | null
  findings: AssessmentFinding[]
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

// App Settings
export interface AppSettings {
  emailEnabled: boolean
  overrideEnabled: boolean
  overrideEmail: string | null
  fromName: string
  fromEmail: string | null
  replyToEmail: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean
  smtpUser: string | null
  smtpPassSet?: boolean
  smtpPass?: string
  businessEmail: string | null
  businessPhone: string | null
  businessAddress: string | null
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

// Service Types
export type ServiceCategory = 'relaxation' | 'sports'

export interface ServiceDuration {
  id?: string
  minutes: number
  price: number | null
  note?: string | null
  isActive?: boolean
  sortOrder?: number
}

export interface NoteBlock {
  title: string
  content: string[]
}

export interface Service {
  id: string
  slug: string
  name: string
  category: ServiceCategory
  summary: string
  description: string[]
  goodFor: string[]
  contraindicationNote?: string | NoteBlock | null
  postBookingNote?: NoteBlock | null
  bookable: boolean
  isActive: boolean
  sortOrder: number
  durations: ServiceDuration[]
}

// Promotion Types
export interface PromotionBookingSummary {
  id: string
  bookingNumber: number
  status: string
  startTime: string
  service?: string | null
  price?: number | null
  discountedPrice?: number | null
  client?: { id: string; firstName: string; lastName: string } | null
}

export interface Promotion {
  id: string
  active: boolean
  message: string
  discountPercentage: number
  applicableTo: 'all' | string[]
  // Present depending on endpoint: count on the list, full rows on the detail.
  bookingCount?: number
  bookings?: PromotionBookingSummary[]
}

// Expense Types
export type ExpenseCategory =
  | 'MILEAGE'
  | 'TRAVEL'
  | 'SUPPLIES'
  | 'INSURANCE_MEMBERSHIP'
  | 'TRAINING'
  | 'MARKETING'
  | 'PHONE_ADMIN'
  | 'CLOTHING_LAUNDRY'
  | 'OTHER'

export interface Expense {
  id: string
  date: string
  amount: number // pence — server-computed for MILEAGE, see src/utils/mileage.ts
  category: ExpenseCategory
  description: string
  vendor?: string | null
  notes?: string | null
  // Only set when category is MILEAGE.
  miles?: number | null
  createdAt: string
  updatedAt: string
  // Present on GET /api/expenses (list).
  receiptCount?: number
  // Present on GET /api/expenses/:id (detail) — receipts attached to this expense.
  receipts?: ReceiptSummary[]
}

// Receipt Types
export interface ReceiptSummary {
  id: string
  vendor?: string | null
  date?: string | null
  totalAmount?: number | null // pence
  fileName: string
}

export interface Receipt {
  id: string
  vendor?: string | null
  date?: string | null
  totalAmount?: number | null // pence
  notes?: string | null
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  createdAt: string
  updatedAt: string
  // Present on GET /api/receipts (list) and /:id (detail).
  expenseCount: number
  loggedTotal: number // pence, sum of linked expenses' amounts
}

export interface ReceiptDetail extends Receipt {
  expenses: {
    id: string
    date: string
    category: ExpenseCategory
    description: string
    amount: number
  }[]
}

// API Response Types
export interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// Auth Types — the session is an httpOnly cookie, so nothing secret is held here.
export interface AuthStore {
  user: { email: string; name?: string | null; picture?: string | null } | null
  isAuthenticated: boolean
  loginWithGoogle(credential: string): Promise<void>
  logout(): Promise<void>
}
