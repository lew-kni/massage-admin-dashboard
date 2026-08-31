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
  // Current/canonical contact details -- kept up to date via the pre-visit
  // form's "has this changed?" flow (see intake.js), which also logs a note
  // here when they change. Distinct from IntakeForm's own copies of these
  // fields, which are a per-visit snapshot rather than the live record.
  emergencyName?: string | null
  emergencyPhone?: string | null
  emergencyRelationship?: string | null
  gpName?: string | null
  gpPhone?: string | null
  gpSurgery?: string | null
  // Marketing-email consent, joined by email from the standalone MarketingContact
  // table (see the backend). Present only on the single-client detail response;
  // null when this person has never opted in.
  marketing?: MarketingStatus | null
  createdAt: string
  updatedAt: string
}

export type MarketingConsentStatus = 'SUBSCRIBED' | 'UNSUBSCRIBED'

// Compact marketing state attached to a client detail record.
export interface MarketingStatus {
  status: MarketingConsentStatus
  source: string | null
  subscribedAt: string
  unsubscribedAt: string | null
}

// A row in the standalone marketing list (GET /api/marketing/contacts).
export interface MarketingContact {
  id: string
  email: string
  name: string | null
  status: MarketingConsentStatus
  source: string | null
  subscribedAt: string
  unsubscribedAt: string | null
}

// A sent marketing campaign (GET /api/marketing/campaigns).
export interface MarketingCampaign {
  id: string
  subject: string
  body: string
  recipientCount: number
  sentCount: number
  failedCount: number
  sentAt: string
}

// Result of POST /api/marketing/send.
export interface MarketingSendResult {
  campaignId: string
  recipientCount: number
  sentCount: number
  failedCount: number
}

// A saved marketing design. `blocks` is the block-builder layout (parsed from
// JSON by the backend). Typed as unknown[] here to avoid a types→utils import
// cycle; the composer/templates code narrows it to MarketingBlock[].
export interface MarketingTemplate {
  id: string
  name: string
  subject: string
  blocks: unknown[]
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
  isSpam: boolean
  deletedAt: string | null
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
  // The specific promo code quoted (for filtering bookings by campaign code).
  promoCodeId?: string | null
  // Pricing captured at booking time (pence). `discountedPrice` is the
  // promotion-adjusted price; null when no promotion applied.
  price?: number | null
  discountedPrice?: number | null
  // Flat charge added on top of the (post-discount) price, e.g. a travel
  // surcharge for a visit outside the usual area. Pence.
  extraCharge?: number | null
  extraChargeReason?: string | null
  // Fee charged when a confirmed booking is cancelled late, per the published
  // cancellation policy. Null = no fee due (enough notice, or waived). Payment
  // of the fee is tracked via the payments[] rows, like a normal booking.
  cancellationFee?: number | null
  // How a CANCELLED booking got there: 'REJECTED' (declined request) vs
  // 'CANCELLED' (cancelled confirmed booking). Null on non-cancelled + legacy.
  cancellationType?: 'REJECTED' | 'CANCELLED' | null
  preFormToken?: string | null
  preFormStatus: 'NOT_SENT' | 'SENT' | 'COMPLETED' | 'OVERDUE'
  preFormSentAt?: string | null
  preFormCompletedAt?: string | null
  // Timestamps for the automated emails, so the admin can see they went out.
  reminderSentAt?: string | null
  followupSentAt?: string | null
  // Payments received against this booking (first-class rows), plus the derived
  // cache. Totals (gross/total/balance) are computed via utils/bookingTotals.
  payments?: Payment[]
  amountPaid?: number
  paymentStatus?: PaymentStatus
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = 'CASH' | 'BACS' | 'CARD' | 'VOUCHER' | 'OTHER'
export type PaymentStatus = 'DUE' | 'PART_PAID' | 'PAID' | 'COMPLIMENTARY'

export interface Payment {
  id: string
  bookingId: string
  amount: number       // pence; positive = received, negative = refund
  method: PaymentMethod
  receivedAt: string
  feeAmount?: number | null  // card terminal fee (CARD only)
  note?: string | null
  createdAt: string
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
  city?: string | null
  postcode?: string | null
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
  // Client's in-person agreement to the treatment plan
  agreedToPlan?: boolean
  signatureName?: string | null
  signatureImage?: string | null // PNG data URL
  signedAt?: string | null // server-stamped when first signed
  findings: AssessmentFinding[]
  createdAt: string
  updatedAt: string
}

export interface BookingAssessmentInput {
  clinicalFindings?: string | null
  proposedAction?: string | null
  generalNotes?: string | null
  agreedToPlan?: boolean
  signatureName?: string | null
  signatureImage?: string | null
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

// Automated email triggers (catalogue metadata merged with saved config)
export interface EmailTrigger {
  key: string
  label: string
  description: string
  timing: 'event' | 'scheduled'
  enabled: boolean
  templateName: string | null
  offsetMinutes: number | null
  templateEditable: boolean
  supportsOffset: boolean
  // Whether the offset is measured before or after the appointment. Only set on
  // scheduled triggers that support an offset.
  offsetDirection?: 'before' | 'after'
}

// App Settings
export interface AppSettings {
  emailEnabled: boolean
  overrideEnabled: boolean
  overrideEmail: string | null
  fromName: string
  fromEmail: string | null
  replyToEmail: string | null
  adminEmail: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean
  smtpUser: string | null
  smtpPassSet?: boolean
  smtpPass?: string
  businessEmail: string | null
  businessPhone: string | null
  businessAddress: string | null
  googleReviewUrl: string | null
  // Bank details for the confirmation email's "How to pay" (BACS) block.
  bankAccountName: string | null
  bankSortCode: string | null
  bankAccountNumber: string | null
  // DANGER ZONE: gate destructive delete actions in the admin UI.
  allowDeleteClients: boolean
  allowDeleteBookings: boolean
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
export type DocumentType = 'REFERRAL' | 'GP_LETTER' | 'CONSENT' | 'MEDICAL' | 'OTHER'

export interface Document {
  id: string
  clientId: string
  // Set when the document was uploaded against a specific booking (e.g. a
  // referral letter for one appointment); null for client-level documents.
  bookingId: string | null
  booking?: { id: string; bookingNumber: number; startTime: string } | null
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  docType: DocumentType
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
  price: number | null // pence; null while pricing is to be confirmed
  note?: string | null
  isActive?: boolean
  sortOrder?: number
  // Pins a promotion to just this duration, overriding service-level matching.
  promotionId?: string | null
}

export interface NoteBlock {
  title: string
  content: string[]
}

export interface ServiceBenefit {
  title: string
  description: string
  icon: string
}

export interface ServicePersona {
  title: string
  description: string
  icon: string
}

export interface Service {
  id: string
  slug: string
  name: string
  category: ServiceCategory
  summary: string
  description: string[]
  benefits?: ServiceBenefit[]
  benefitsTitle?: string
  personas?: ServicePersona[]
  personasTitle?: string
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

// Promotions (auto-applied, public) and vouchers (code-redeemed, private) share
// one model, discriminated by `kind`. See the backend's src/utils/pricing.js.
export type PromotionKind = 'PROMOTION' | 'VOUCHER'
export type DiscountType = 'PERCENT' | 'FIXED'

export interface Promotion {
  id: string
  active: boolean
  kind: PromotionKind
  // Internal campaign name (admin-only), distinct from the client-facing message.
  name?: string | null
  message: string
  discountType: DiscountType
  // PERCENT uses discountPercentage (0–100); FIXED uses discountAmount (pence).
  discountPercentage: number
  discountAmount?: number | null
  applicableTo: 'all' | string[]
  // "all" or a list of duration lengths (minutes) the discount applies to.
  applicableDurations: 'all' | number[]
  // Extended copy for the brochure's "more info" modal. null until an admin
  // fills it in — the brochure falls back to showing just `message` there.
  details?: string[] | null
  // Promotions only: opt this one into the sitewide brochure banner.
  displayAsBanner: boolean
  // Only apply to a client with no prior CONFIRMED booking (email/phone match).
  firstBookingOnly?: boolean
  // Usable for pricing (bookings, duration pins) but hidden from the public
  // site — for one-off manual discounts, e.g. comping a friend's booking.
  internal: boolean
  // Voucher-only fields (null/absent for promotions).
  code?: string | null
  expiresAt?: string | null
  usageLimit?: number | null
  usageCount?: number
  // Codes belonging to this promotion (present on the detail endpoint).
  promoCodes?: PromoCode[]
  // Present depending on endpoint: count on the list, full rows on the detail.
  bookingCount?: number
  bookings?: PromotionBookingSummary[]
}

export interface PromoCode {
  id: string
  code: string
  label?: string | null
  // Free-text log of where flyers carrying this code have been placed.
  placements?: string | null
  usageLimit?: number | null
  usageCount: number
  active: boolean
  // Bookings that used this code (present on the promotion detail endpoint).
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

// The supplier an expense/receipt is paid to — a first-class entity now, not a
// free-text label. Endpoints return the linked vendor's id + name nested under
// `vendor`; `vendorId` is what the forms send.
export interface VendorRef {
  id: string
  name: string
}

export interface Expense {
  id: string
  date: string
  amount: number // pence — server-computed for MILEAGE, see src/utils/mileage.ts
  category: ExpenseCategory
  description: string
  vendorId?: string | null
  vendor?: VendorRef | null
  notes?: string | null
  // Only set when category is MILEAGE.
  miles?: number | null
  // Set when this expense was generated from a monthly recurring template.
  recurringExpenseId?: string | null
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
  vendorId?: string | null
  vendor?: VendorRef | null
  date?: string | null
  totalAmount?: number | null // pence
  fileName: string
}

export interface Receipt {
  id: string
  vendorId?: string | null
  vendor?: VendorRef | null
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

// Post-visit feedback left by a client via the day-after follow-up email.
export interface Feedback {
  id: string
  rating: number // 1–5
  wentWell: string | null // "What went well?"
  improve: string | null // "What could I improve on?"
  createdAt: string
  client: { id: string; firstName: string; lastName: string } | null
  booking: { id: string; bookingNumber: number; service: string | null; startTime: string } | null
}

// The therapist's own private notes on a booking ("self feedback").
export interface SelfFeedback {
  id: string
  bookingId: string
  clientId: string
  notes: string
  createdAt: string
  updatedAt: string
}

// List row for the Self Feedback subpage — includes booking + client context.
export interface SelfFeedbackListItem extends SelfFeedback {
  client: { id: string; firstName: string; lastName: string } | null
  booking: { id: string; bookingNumber: number; service: string | null; startTime: string } | null
}

// Vendor Types — a supplier that owns many expenses and many receipts.
export interface Vendor {
  id: string
  name: string
  notes?: string | null
  // Pre-fills the expense category when logging against this vendor; one of the
  // ExpenseCategory keys, or null.
  defaultCategory?: ExpenseCategory | null
  createdAt: string
  updatedAt: string
  // Present on GET /api/vendors (list) and /:id (detail).
  expenseCount: number
  receiptCount: number
  totalSpent: number // pence, sum of linked expenses' amounts
}

export interface VendorDetail extends Vendor {
  expenses: (Expense & { receiptCount?: number })[]
  receipts: Receipt[]
  // Raw recurring templates for this vendor — the detail endpoint doesn't
  // compute missingMonths (that's the Expenses dashboard's concern).
  recurringExpenses: Omit<RecurringExpense, 'missingMonths'>[]
}

// Recurring expense Types — a monthly template that generates real expenses.
export interface MonthRef {
  year: number
  month: number // 1-12
  label: string // e.g. "Aug 2026"
  date: string // ISO date a generated expense would use
}

export interface RecurringExpense {
  id: string
  description: string
  category: ExpenseCategory // never MILEAGE
  amount: number // pence — the usual amount pre-filled into each generated month
  dayOfMonth: number // 1-28
  vendorId?: string | null
  vendor?: VendorRef | null
  notes?: string | null
  active: boolean
  startDate: string
  endDate?: string | null
  createdAt: string
  updatedAt: string
  // Months from startDate to now with no generated expense yet.
  missingMonths: MonthRef[]
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
