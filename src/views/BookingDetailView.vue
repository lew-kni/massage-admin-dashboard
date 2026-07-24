<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <RouterLink to="/bookings" class="text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300">
        <i class="fas fa-arrow-left mr-1"></i>Back to Bookings
      </RouterLink>
    </div>

    <!-- Save Error -->
    <div v-if="saveError" class="mb-6 p-3 bg-red-50 border border-red-200 rounded">
      <p class="text-sm text-red-700">{{ saveError }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="bookingsStore.loading && !booking" class="text-center py-12">
      <p class="text-gray-500">Loading booking details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!booking" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">Booking not found.</p>
    </div>

    <!-- Booking Details -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Booking Information Card -->
        <div class="card">
          <div class="card-header flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-semibold">Booking #{{ booking.bookingNumber }}</h2>
              <p class="text-gray-500 text-sm mt-1">Created {{ formatRelative(booking.createdAt) }}</p>
            </div>
            <span :class="['badge', getStatusClass(booking.status)]">
              {{ booking.status }}
            </span>
          </div>
          <div class="card-body space-y-6">
            <!-- Client Information -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold text-gray-900">Client Information</h3>
                <div class="flex items-center gap-3">
                  <button
                    @click="showChangeClient = true"
                    class="text-sage-600 hover:text-sage-700 text-sm font-medium inline-flex items-center gap-1"
                  >
                    <i class="fas fa-arrows-rotate"></i>
                    <span>Change Client</span>
                  </button>
                  <RouterLink
                    v-if="booking.clientId"
                    :to="`/clients/${booking.clientId}`"
                    class="text-sage-600 hover:text-sage-700 text-sm font-medium"
                  >
                    View Profile<i class="fas fa-arrow-right ml-1"></i>
                  </RouterLink>
                </div>
              </div>
              <div v-if="changeClientError" class="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                <p class="text-xs text-red-700">{{ changeClientError }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Name</p>
                  <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="font-medium">
                    <a v-if="booking.client?.email" :href="`mailto:${booking.client.email}`" class="text-sage-600 hover:underline break-all">
                      {{ booking.client.email }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Phone</p>
                  <p class="font-medium">
                    <a v-if="booking.client?.phone" :href="`tel:${booking.client.phone}`" class="text-sage-600 hover:underline">
                      {{ booking.client.phone }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div class="col-span-2">
                  <p class="text-sm text-gray-500">Address</p>
                  <p class="font-medium whitespace-pre-line">
                    <span v-if="clientAddress">{{ clientAddress }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Appointment Details -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-3">Appointment Details</h3>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-sm text-gray-500">Date</label>
                    <p v-if="!isEditing" class="font-medium">{{ formatDate(booking.startTime) }}</p>
                    <AvailabilityDatePicker
                      v-else
                      v-model="editForm.startDate"
                      :duration="Number(editForm.duration) || null"
                      :exclude-booking-id="booking.id"
                      class="mt-1"
                    />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Start Time</label>
                    <p v-if="!isEditing" class="font-medium">{{ formatTime(booking.startTime) }}</p>
                    <input v-else v-model="editForm.startTime" type="time" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Duration</label>
                    <p v-if="!isEditing" class="font-medium">{{ calculateDuration(booking.startTime, booking.endTime) }} minutes</p>
                    <input v-else v-model="editForm.duration" type="number" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Service</label>
                    <p v-if="!isEditing" class="font-medium">
                      <span v-if="booking.service">{{ booking.service }}</span>
                      <span v-else class="text-gray-400">Not provided</span>
                    </p>
                    <input v-else v-model="editForm.service" type="text" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Price</label>
                    <p class="font-medium">
                      <template v-if="booking.price !== null && booking.price !== undefined">
                        <span
                          v-if="booking.discountedPrice !== null && booking.discountedPrice !== undefined && booking.discountedPrice !== booking.price"
                          class="text-gray-400 line-through mr-1"
                        >£{{ booking.price }}</span>
                        <span>£{{ booking.discountedPrice ?? booking.price }}</span>
                        <span
                          v-if="booking.discountedPrice !== null && booking.discountedPrice !== undefined && booking.discountedPrice !== booking.price"
                          class="ml-2 badge bg-amber-100 text-amber-800"
                        >{{ booking.promotion ? 'Promotion' : 'Discount' }}</span>
                      </template>
                      <span v-else class="text-gray-400">Not set</span>
                    </p>
                    <!-- Applied promotion or manual discount + revoke (e.g. TOS abuse, or undoing a one-off) -->
                    <div v-if="hasActiveDiscount" class="mt-1 flex items-center flex-wrap gap-2">
                      <span class="text-xs text-amber-700">
                        <i class="fas fa-tag mr-1"></i>{{ booking.promotion ? booking.promotion.message : 'Manual discount' }}
                      </span>
                      <button
                        @click="onRemoveDiscount"
                        :disabled="removingDiscount"
                        class="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {{ removingDiscount ? 'Removing…' : 'Remove' }}
                      </button>
                    </div>
                    <!-- Nothing applied yet: apply a stored promotion after the
                         fact (e.g. comping a friend), or a one-off manual
                         discount that doesn't need a Promotion record at all. -->
                    <div v-else class="mt-1 space-y-1.5">
                      <div class="flex items-center flex-wrap gap-2">
                        <select v-model="selectedPromotionId" class="input-field text-xs py-1 w-48">
                          <option value="">Apply a promotion…</option>
                          <option v-for="p in servicesStore.promotions.filter((p) => p.active)" :key="p.id" :value="p.id">
                            {{ p.message }}{{ p.internal ? ' (internal)' : '' }}
                          </option>
                        </select>
                        <button
                          v-if="selectedPromotionId"
                          @click="onApplyPromotion"
                          :disabled="applyingPromotion"
                          class="text-xs text-sage-600 hover:text-sage-700 font-medium disabled:opacity-50"
                        >
                          {{ applyingPromotion ? 'Applying…' : 'Apply' }}
                        </button>
                      </div>
                      <div v-if="booking.price != null" class="flex items-center flex-wrap gap-2">
                        <select v-model="discountMode" class="input-field text-xs py-1 w-16">
                          <option value="percent">%</option>
                          <option value="amount">£</option>
                        </select>
                        <input
                          v-model.number="discountValue"
                          type="number"
                          min="0"
                          :max="discountMode === 'percent' ? 100 : undefined"
                          step="1"
                          placeholder="One-off discount"
                          class="input-field text-xs py-1 w-32"
                        />
                        <button
                          v-if="discountValue"
                          @click="onApplyDiscount"
                          :disabled="applyingDiscount"
                          class="text-xs text-sage-600 hover:text-sage-700 font-medium disabled:opacity-50"
                        >
                          {{ applyingDiscount ? 'Applying…' : 'Apply' }}
                        </button>
                      </div>
                    </div>
                    <p v-if="discountError" class="mt-1 text-xs text-red-700">{{ discountError }}</p>
                  </div>
                </div>
                <div v-if="isEditing">
                  <label class="text-sm text-gray-500">Status</label>
                  <select v-model="editForm.status" class="input-field mt-1">
                    <option>PENDING</option>
                    <option>CONFIRMED</option>
                    <option>CANCELLED</option>
                    <option>COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Notes</label>
                  <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                    <span v-if="booking.notes">{{ booking.notes }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                  <textarea v-else v-model="editForm.notes" class="input-field mt-1" rows="3"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session & Health Details Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-heartbeat mr-2"></i>Session &amp; Health Details</h2>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500">Pressure preference</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.pressurePreference">{{ formatPressure(booking.pressurePreference) }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <select v-else v-model="editForm.pressurePreference" class="input-field mt-1">
                  <option value="">—</option>
                  <option value="gentle">Gentle</option>
                  <option value="medium">Medium</option>
                  <option value="firm">Firm</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-500">First massage?</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.firstTime === true">Yes</span>
                  <span v-else-if="booking.firstTime === false">No</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <select v-else v-model="editForm.firstTime" class="input-field mt-1">
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-500">Location postcode</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.postcode">{{ booking.postcode }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <input v-else v-model="editForm.postcode" type="text" class="input-field mt-1" />
              </div>
              <div>
                <label class="text-sm text-gray-500">Allergies</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.allergies">{{ booking.allergies }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <input v-else v-model="editForm.allergies" type="text" class="input-field mt-1" />
              </div>
            </div>
            <div class="mt-4">
              <label class="text-sm text-gray-500">Health conditions / injuries</label>
              <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                <span v-if="booking.healthConditions">{{ booking.healthConditions }}</span>
                <span v-else class="text-gray-400">Not provided</span>
              </p>
              <textarea v-else v-model="editForm.healthConditions" class="input-field mt-1" rows="3"></textarea>
            </div>
            <div class="mt-4">
              <label class="text-sm text-gray-500">Focus / problem areas</label>
              <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                <span v-if="booking.problemAreas">{{ booking.problemAreas }}</span>
                <span v-else class="text-gray-400">Not provided</span>
              </p>
              <textarea v-else v-model="editForm.problemAreas" class="input-field mt-1" rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- Pre-Massage Form Card -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-clipboard mr-2"></i>Pre-Massage Form</h2>
            <span :class="['badge', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
              {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
            </span>
          </div>
          <div class="card-body">
            <!-- Completed: render responses -->
            <div v-if="booking.preFormStatus === 'COMPLETED' && intake">
              <!-- Contraindication / GP-permission alert -->
              <div v-if="intake.hasContraindications || intake.gpPermissionGiven" class="mb-4 p-3 rounded bg-red-50 border border-red-200">
                <p class="text-sm font-semibold text-red-800"><i class="fas fa-triangle-exclamation mr-1"></i>Review before treatment</p>
                <p v-if="intake.hasContraindications" class="text-sm text-red-700 mt-1">Client reported possible contraindications<span v-if="(intake.contraindicationFlags || []).length"> — {{ (intake.contraindicationFlags || []).join(', ') }}</span>.</p>
                <p v-if="intake.gpPermissionGiven" class="text-sm text-red-700 mt-1">GP/consultant permission indicated — check the referral letter.</p>
              </div>

              <div class="flex items-center gap-2 mb-4 text-xs">
                <span class="badge" :class="intake.completedInPerson ? 'bg-sky-100 text-sky-800' : 'bg-green-100 text-green-800'">
                  {{ intake.completedInPerson ? 'Filled in by you (in person)' : 'Completed by client' }}
                </span>
                <span v-if="intake.submittedAt" class="text-gray-400">{{ formatDateTime(intake.submittedAt) }}</span>
              </div>

              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div v-for="row in intakeRows" :key="row.label" :class="row.wide ? 'sm:col-span-2' : ''">
                  <dt class="text-gray-500">{{ row.label }}</dt>
                  <dd class="font-medium whitespace-pre-wrap">{{ row.value }}</dd>
                </div>
              </dl>

              <!-- Body diagram -->
              <div v-if="intake.bodyDiagram && intake.bodyDiagram.length" class="mt-6 border-t pt-4">
                <h3 class="font-semibold text-gray-900 mb-3">Areas of concern</h3>
                <BodyDiagramView :markers="intake.bodyDiagram" />
              </div>

              <p class="mt-4 text-xs text-gray-500">Signed: <span class="font-medium">{{ intake.signatureName }}</span></p>
            </div>

            <!-- Not completed: placeholder -->
            <div v-else class="border-l-4 border-sage-300 pl-4 py-2 space-y-1">
              <p class="text-gray-700 font-medium">No responses yet</p>
              <p class="text-sm text-gray-500">
                <span v-if="booking.preFormStatus === 'SENT'">Form sent{{ booking.preFormSentAt ? ` ${formatRelative(booking.preFormSentAt)}` : '' }} — waiting for the client to complete it.</span>
                <span v-else>Send the client their pre-visit form, or fill it in with them.</span>
              </p>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex flex-wrap gap-2">
              <button @click="onSendPreForm" :disabled="sendingPreform" class="btn-primary text-sm">
                <i class="fas fa-envelope"></i>
                <span>{{ sendingPreform ? 'Sending…' : (booking.preFormStatus === 'NOT_SENT' ? 'Send Form to Client' : 'Resend Form') }}</span>
              </button>
              <button @click="onFillOnBehalf" class="btn-secondary text-sm">
                <i class="fas fa-pen-to-square"></i>
                <span>Fill in on their behalf</span>
              </button>
              <button @click="onCopyLink" class="btn-secondary text-sm">
                <i class="fas" :class="linkCopied ? 'fa-check' : 'fa-link'"></i>
                <span>{{ linkCopied ? 'Copied' : 'Copy link' }}</span>
              </button>
            </div>
            <p v-if="preformError" class="mt-2 text-sm text-red-700">{{ preformError }}</p>
          </div>
        </div>

        <!-- Therapist's own assessment for this session -->
        <AssessmentSection :booking-id="booking.id" />
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Quick Actions</h3>
          </div>
          <div class="card-body space-y-3">
            <button v-if="!isEditing" @click="showSendEmail = true" class="btn-primary w-full text-sm">
              <i class="fas fa-envelope"></i>
              <span>Send Email</span>
            </button>
            <button v-if="!isEditing" @click="isEditing = true" class="btn-secondary w-full text-sm">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <template v-else>
              <button @click="saveBooking" :disabled="saving" class="btn-primary w-full text-sm">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button @click="cancelEdit" class="btn-secondary w-full text-sm">
                Cancel Edit
              </button>
            </template>
            <button v-if="!isEditing && !isBookingPast(booking)" class="btn-danger w-full text-sm">
              <i class="fas fa-trash-alt"></i>
              <span>Cancel Booking</span>
            </button>
            <button
              v-if="!isEditing && !booking.isPaid"
              @click="isFreeBooking ? onMarkComplimentary() : (showPaymentModal = true)"
              class="btn-primary w-full text-sm bg-emerald-600 hover:bg-emerald-700"
            >
              <i class="fas fa-check-circle"></i>
              <span>{{ isFreeBooking ? 'Mark as Complimentary' : 'Mark as Paid' }}</span>
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Details</h3>
          </div>
          <div class="card-body space-y-4 text-sm">
            <div>
              <p class="text-gray-500">Booking Number</p>
              <p class="font-medium">#{{ booking.bookingNumber }}</p>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <span :class="['badge mt-1', getStatusClass(booking.status)]">
                {{ booking.status }}
              </span>
            </div>
            <div>
              <p class="text-gray-500">Form Status</p>
              <span :class="['badge mt-1', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
                {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
              </span>
            </div>
            <div>
              <p class="text-gray-500">Created</p>
              <p class="font-medium">{{ formatDateTime(booking.createdAt) }}</p>
            </div>
            <div class="border-t pt-4">
              <p class="text-gray-500 mb-3">Payment Status</p>
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ booking.paymentMethod === 'COMPLIMENTARY' ? 'Complimentary' : booking.isPaid ? 'Paid' : 'Unpaid' }}</span>
                <div v-if="!booking.isPaid" class="flex gap-2">
                  <button @click="isFreeBooking ? onMarkComplimentary() : (showPaymentModal = true)" class="text-sage-600 hover:text-sage-700 text-sm font-medium">
                    <i class="fas fa-plus-circle mr-1"></i>{{ isFreeBooking ? 'Mark Complimentary' : 'Mark Paid' }}
                  </button>
                </div>
              </div>
              <div v-if="booking.isPaid && booking.paymentMethod && booking.paymentMethod !== 'COMPLIMENTARY'" class="text-sm mt-2">
                <p class="text-gray-600">Method: <span class="font-medium">{{ booking.paymentMethod }}</span></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold"><i class="fas fa-file-lines mr-2"></i>Documents</h3>
          </div>
          <div class="card-body space-y-3">
            <p class="text-sm text-gray-500 text-center py-4">No documents uploaded yet</p>
            <button class="btn-secondary w-full text-sm">
              <i class="fas fa-paperclip"></i>
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ChangeClientModal
      v-if="showChangeClient && booking"
      :current-client-id="booking.clientId"
      @close="showChangeClient = false"
      @select="onSelectClient"
    />

    <SendEmailModal
      v-if="showSendEmail && booking && booking.client"
      :client="booking.client"
      :booking="booking"
      @close="showSendEmail = false"
    />

    <PaymentMethodModal
      v-if="showPaymentModal"
      :saving="savingPayment"
      @close="showPaymentModal = false"
      @confirm="confirmPaymentMethod"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import { useServicesStore } from '@/stores/services'
import { apiService } from '@/services/api'
import type { Booking, IntakeForm } from '@/types'
import { format, formatDistanceToNow } from 'date-fns'
import ChangeClientModal from '@/components/ChangeClientModal.vue'
import SendEmailModal from '@/components/SendEmailModal.vue'
import PaymentMethodModal from '@/components/PaymentMethodModal.vue'
import BodyDiagramView from '@/components/BodyDiagramView.vue'
import AvailabilityDatePicker from '@/components/AvailabilityDatePicker.vue'
import AssessmentSection from '@/components/AssessmentSection.vue'

const route = useRoute()
const bookingsStore = useBookingsStore()
const servicesStore = useServicesStore()

const booking = ref<Booking | null>(null)
const showChangeClient = ref(false)
const changeClientError = ref('')
const showSendEmail = ref(false)
const showPaymentModal = ref(false)
const removingDiscount = ref(false)
const applyingPromotion = ref(false)
const selectedPromotionId = ref('')
const applyingDiscount = ref(false)
const discountMode = ref<'percent' | 'amount'>('percent')
const discountValue = ref<number | null>(null)
const discountError = ref('')

const hasActiveDiscount = computed(() => {
  const b = booking.value
  if (!b) return false
  return b.discountedPrice !== null && b.discountedPrice !== undefined && b.discountedPrice !== b.price
})

// A discount (or a £0 list price) that brings the booking to £0 — no money
// to collect, so payment status skips the Cash/BACS choice entirely.
const isFreeBooking = computed(() => {
  const b = booking.value
  if (!b) return false
  const effective = b.discountedPrice ?? b.price
  return effective === 0
})

// Pre-visit intake form
const intake = ref<IntakeForm | null>(null)
const sendingPreform = ref(false)
const preformError = ref('')
const linkCopied = ref(false)

const yn = (v?: boolean | null) => (v === true ? 'Yes' : v === false ? 'No' : '—')

const intakeRows = computed(() => {
  const f = intake.value
  if (!f) return [] as { label: string; value: string; wide?: boolean }[]
  const rows: { label: string; value: string; wide?: boolean }[] = [
    { label: 'Full name', value: f.fullName || '—' },
    { label: 'Date of birth', value: f.dateOfBirth || '—' },
    { label: 'Contact number', value: f.phone || '—' },
    { label: 'Occupation', value: f.occupation || '—' },
    { label: 'Address', value: f.address || '—', wide: true },
    { label: 'Emergency contact', value: [f.emergencyName, f.emergencyPhone, f.emergencyRelationship].filter(Boolean).join(' · ') || '—', wide: true },
    { label: 'GP', value: [f.gpName, f.gpPhone, f.gpSurgery].filter(Boolean).join(' · ') || '—', wide: true },
    { label: 'Contraindications in last 6 months?', value: yn(f.hasContraindications) },
    { label: 'Visited GP in last 6 months?', value: yn(f.visitedGpRecently) },
  ]
  if (f.hasContraindications && f.contraindicationDetails) rows.push({ label: 'Contraindication details', value: f.contraindicationDetails, wide: true })
  if (f.visitedGpRecently && f.gpVisitDetails) rows.push({ label: 'GP visit details', value: f.gpVisitDetails, wide: true })
  if (f.currentMedications) rows.push({ label: 'Current medications', value: f.currentMedications, wide: true })
  if (f.reasonForVisit) rows.push({ label: 'Reason for visit', value: f.reasonForVisit, wide: true })
  if (f.subjectiveHistory) rows.push({ label: 'Anything else', value: f.subjectiveHistory, wide: true })
  return rows
})

async function loadIntake() {
  if (!booking.value || booking.value.preFormStatus !== 'COMPLETED') return
  try {
    intake.value = await apiService.getIntake(booking.value.id)
  } catch {
    intake.value = null
  }
}

async function onSendPreForm() {
  if (!booking.value) return
  if (booking.value.preFormStatus !== 'NOT_SENT' && !confirm('Resend the pre-visit form link to the client?')) return
  sendingPreform.value = true
  preformError.value = ''
  try {
    booking.value = await apiService.sendPreForm(booking.value.id)
  } catch (err: any) {
    preformError.value = err?.response?.data?.error || err?.message || 'Failed to send the form'
  } finally {
    sendingPreform.value = false
  }
}

async function onFillOnBehalf() {
  if (!booking.value) return
  preformError.value = ''
  try {
    const { url } = await apiService.getPreFormLink(booking.value.id)
    window.open(`${url}?by=therapist`, '_blank')
  } catch (err: any) {
    preformError.value = err?.response?.data?.error || 'Failed to open the form'
  }
}

async function onCopyLink() {
  if (!booking.value) return
  preformError.value = ''
  try {
    const { url } = await apiService.getPreFormLink(booking.value.id)
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch (err: any) {
    preformError.value = err?.response?.data?.error || 'Failed to copy the link'
  }
}
const editingPayment = ref(false)
const savingPayment = ref(false)
const paymentError = ref('')
const editingPaymentForm = reactive({
  isPaid: false,
  paymentMethod: '' as 'CASH' | 'BACS' | '',
})

// Clears whatever pricing adjustment is on the booking -- a stored promotion
// or a one-off manual discount both revert via the same endpoint.
async function onRemoveDiscount() {
  if (!booking.value || !hasActiveDiscount.value) return
  const label = booking.value.promotion ? `the "${booking.value.promotion.message}" promotion` : 'the manual discount'
  if (!confirm(`Remove ${label} from this booking? The price will revert to the full amount.`)) return
  removingDiscount.value = true
  discountError.value = ''
  try {
    booking.value = await bookingsStore.removePromotion(booking.value.id)
  } catch (err: any) {
    discountError.value = err?.message || 'Failed to remove discount'
  } finally {
    removingDiscount.value = false
  }
}

// Attaches a promotion after the booking already exists -- e.g. comping a
// friend's session. Only changes pricing; intake form and assessment (kept
// on separate rows keyed off the booking) are untouched.
async function onApplyPromotion() {
  if (!booking.value || !selectedPromotionId.value) return
  applyingPromotion.value = true
  discountError.value = ''
  try {
    booking.value = await bookingsStore.applyPromotion(booking.value.id, selectedPromotionId.value)
    selectedPromotionId.value = ''
  } catch (err: any) {
    discountError.value = err?.response?.data?.error || err?.message || 'Failed to apply promotion'
  } finally {
    applyingPromotion.value = false
  }
}

// One-off manual discount -- a percentage or flat £ amount off, for deals
// that don't warrant a standing (internal) Promotion record.
async function onApplyDiscount() {
  if (!booking.value || !discountValue.value || discountValue.value <= 0) return
  applyingDiscount.value = true
  discountError.value = ''
  try {
    const payload = discountMode.value === 'percent'
      ? { discountPercentage: discountValue.value }
      : { discountAmount: discountValue.value }
    booking.value = await bookingsStore.applyDiscount(booking.value.id, payload)
    discountValue.value = null
  } catch (err: any) {
    discountError.value = err?.response?.data?.error || err?.message || 'Failed to apply discount'
  } finally {
    applyingDiscount.value = false
  }
}

async function onSelectClient(clientId: string) {
  if (!booking.value) return
  changeClientError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, { clientId } as Partial<Booking>)
    booking.value = updated
    showChangeClient.value = false
  } catch (err: any) {
    changeClientError.value = err?.message || 'Failed to change client'
  }
}

// Full postal address for the client, assembled from address / city / postcode
const clientAddress = computed(() => {
  const c = booking.value?.client
  if (!c) return ''
  return [c.address, c.city, c.postcode]
    .map(part => (part || '').trim())
    .filter(Boolean)
    .join('\n')
})
const isEditing = ref(false)
const saveError = ref('')
const saving = ref(false)
const editForm = reactive({
  startDate: '',
  startTime: '',
  duration: 0,
  service: '',
  status: 'CONFIRMED',
  notes: '',
  postcode: '',
  healthConditions: '',
  problemAreas: '',
  pressurePreference: '' as '' | 'gentle' | 'medium' | 'firm',
  firstTime: '' as '' | 'yes' | 'no',
  allergies: '',
})

function initEditForm() {
  const b = booking.value
  if (!b) return
  editForm.startDate = b.startTime.split('T')[0]
  editForm.startTime = format(new Date(b.startTime), 'HH:mm')
  editForm.duration = calculateDuration(b.startTime, b.endTime)
  editForm.service = b.service || ''
  editForm.status = b.status
  editForm.notes = b.notes || ''
  editForm.postcode = b.postcode || ''
  editForm.healthConditions = b.healthConditions || ''
  editForm.problemAreas = b.problemAreas || ''
  editForm.pressurePreference = (b.pressurePreference as any) || ''
  editForm.firstTime = b.firstTime === true ? 'yes' : b.firstTime === false ? 'no' : ''
  editForm.allergies = b.allergies || ''
}

onMounted(async () => {
  await bookingsStore.fetchBookings()
  const bookingId = route.params.id as string
  booking.value = bookingsStore.bookings.find(b => b.id === bookingId) || null
  initEditForm()
  initPaymentForm()
  await loadIntake()
  if (servicesStore.promotions.length === 0) servicesStore.fetchPromotions()
})

function formatPressure(value?: string | null): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy')
}

function formatRelative(date?: string): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatTime(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'h:mm a')
}

function formatDateTime(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

function calculateDuration(start?: string, end?: string): number {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function getStatusClass(status?: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'badge-success'
    case 'PENDING':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-danger'
    case 'COMPLETED':
      return 'bg-purple-100 text-purple-800'
    default:
      return ''
  }
}

function formatPreFormStatus(status?: string): string {
  if (!status) return 'Unknown'
  return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

function getPreFormStatusClass(status?: string): string {
  switch (status) {
    case 'NOT_SENT':
      return 'bg-gray-100 text-gray-800'
    case 'SENT':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'badge-success'
    case 'OVERDUE':
      return 'badge-danger'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

async function saveBooking() {
  if (!booking.value) return
  const start = new Date(`${editForm.startDate}T${editForm.startTime}:00`)
  if (isNaN(start.getTime())) {
    saveError.value = 'Invalid date or time'
    return
  }
  const end = new Date(start.getTime() + Number(editForm.duration) * 60000)

  saving.value = true
  saveError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: editForm.status as Booking['status'],
      service: editForm.service.trim() || null,
      notes: editForm.notes.trim() || null,
      postcode: editForm.postcode.trim() || null,
      healthConditions: editForm.healthConditions.trim() || null,
      problemAreas: editForm.problemAreas.trim() || null,
      pressurePreference: editForm.pressurePreference || null,
      firstTime: editForm.firstTime === 'yes' ? true : editForm.firstTime === 'no' ? false : null,
      allergies: editForm.allergies.trim() || null,
    })
    booking.value = updated
    isEditing.value = false
  } catch (err: any) {
    saveError.value = err?.message || 'Failed to save booking'
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  initEditForm()
  saveError.value = ''
  isEditing.value = false
}

function isBookingPast(b: Booking | null): boolean {
  if (!b) return false
  return new Date(b.startTime) <= new Date()
}

function initPaymentForm() {
  if (!booking.value) return
  editingPaymentForm.isPaid = booking.value.isPaid || false
  editingPaymentForm.paymentMethod = (booking.value.paymentMethod as any) || ''
}

async function savePaymentStatus() {
  if (!booking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, {
      isPaid: editingPaymentForm.isPaid,
      paymentMethod: editingPaymentForm.isPaid ? (editingPaymentForm.paymentMethod as 'CASH' | 'BACS') : null,
    } as Partial<Booking>)
    booking.value = updated
    editingPayment.value = false
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to save payment status'
  } finally {
    savingPayment.value = false
  }
}

function cancelPaymentEdit() {
  editingPayment.value = false
  initPaymentForm()
  paymentError.value = ''
}

async function confirmPaymentMethod(method: 'CASH' | 'BACS') {
  if (!booking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, {
      isPaid: true,
      paymentMethod: method,
    } as Partial<Booking>)
    booking.value = updated
    showPaymentModal.value = false
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to save payment status'
  } finally {
    savingPayment.value = false
  }
}

// £0 bookings skip the Cash/BACS modal entirely -- there's no payment to
// reconcile a method for.
async function onMarkComplimentary() {
  if (!booking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, {
      isPaid: true,
      paymentMethod: 'COMPLIMENTARY',
    } as Partial<Booking>)
    booking.value = updated
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to mark as complimentary'
  } finally {
    savingPayment.value = false
  }
}
</script>
