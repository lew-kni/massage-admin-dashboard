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
    <div v-else class="space-y-6">
      <!-- Status banner -->
      <div :class="['rounded-lg px-5 py-4 flex items-center justify-between', bannerClass]">
        <div>
          <p class="text-lg font-semibold">{{ bannerLabel }}</p>
          <p class="text-sm opacity-80">{{ bookingRef(booking) }} · Created {{ formatRelative(booking.createdAt) }}</p>
        </div>
        <i :class="['fas text-2xl opacity-70', bannerIcon]"></i>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Appointment Details Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-calendar-day mr-2"></i>Appointment Details</h2>
          </div>
          <div class="card-body">
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

        <!-- Client Information Card -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-user mr-2"></i>Client Information</h2>
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
          <div class="card-body">
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
        </div>

        <!-- Money Card -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-sterling-sign mr-2"></i>Payments</h2>
            <span :class="['badge uppercase', paymentStatusBadgeClass(paymentTotals.paymentStatus)]">{{ paymentStatusLabel(paymentTotals.paymentStatus) }}</span>
          </div>
          <div class="card-body space-y-4">
            <!-- Charges -->
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
              <!-- Extra charge (e.g. travel) as a line + total when set -->
              <p v-if="!isEditing && booking.extraCharge" class="text-sm text-gray-700 mt-0.5">
                + £{{ booking.extraCharge }}<span v-if="booking.extraChargeReason" class="text-gray-500"> · {{ booking.extraChargeReason }}</span>
                <span class="ml-2 font-medium">Total £{{ bookingTotal(booking) }}</span>
              </p>
              <!-- Cancellation fee, when this booking was cancelled with a charge -->
              <p v-if="!isEditing && booking.status === 'CANCELLED' && booking.cancellationFee" class="text-sm text-red-700 mt-0.5">
                <i class="fas fa-ban mr-1"></i>Cancellation fee: £{{ booking.cancellationFee }}
              </p>
              <p v-else-if="!isEditing && booking.status === 'CANCELLED'" class="text-sm text-gray-500 mt-0.5">
                <i class="fas fa-ban mr-1"></i>Cancelled — no fee
              </p>
              <!-- Applied promotion or manual discount + revoke -->
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
              <!-- Nothing applied yet: apply a stored promotion or a one-off manual discount -->
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

            <!-- Extra charge edit -->
            <div v-if="isEditing">
              <label class="text-sm text-gray-500">Extra charge (£)</label>
              <div class="flex items-center gap-2 mt-1">
                <input v-model.number="editForm.extraCharge" type="number" min="0" step="1" placeholder="0" class="input-field w-24" />
                <input v-model="editForm.extraChargeReason" type="text" maxlength="200" placeholder="Reason (e.g. travel outside area)" class="input-field flex-1" />
              </div>
              <p class="text-xs text-gray-400 mt-1">Added on top of the price and shown to the client on their confirmation.</p>
            </div>

            <!-- Payments -->
            <div class="border-t pt-4">
              <div class="text-sm space-y-1">
                <div v-if="paymentTotals.grossTotal !== paymentTotals.total" class="flex items-center justify-between text-gray-500">
                  <span>Gross</span><span class="line-through">£{{ paymentTotals.grossTotal }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Total due</span><span class="font-medium">£{{ paymentTotals.total }}</span>
                </div>
                <div v-if="paymentTotals.amountPaid" class="flex items-center justify-between">
                  <span class="text-gray-600">Paid</span><span class="font-medium">£{{ paymentTotals.amountPaid }}</span>
                </div>
                <div v-if="paymentTotals.paymentStatus !== 'COMPLIMENTARY'" class="flex items-center justify-between">
                  <span class="text-gray-600">Balance</span>
                  <span class="font-medium" :class="paymentTotals.balance > 0 ? 'text-red-600' : 'text-green-600'">£{{ paymentTotals.balance }}</span>
                </div>
              </div>
              <div v-if="booking.payments && booking.payments.length" class="mt-4 grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 text-sm">
                <!-- Header row -->
                <div class="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</div>
                <div class="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</div>
                <div class="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</div>
                <div class="pb-2"></div>

                <!-- One row per payment (+ a full-width note line when present) -->
                <template v-for="p in booking.payments" :key="p.id">
                  <div class="border-t border-gray-100 dark:border-gray-800 py-2 font-medium tabular-nums">£{{ p.amount }}</div>
                  <div class="border-t border-gray-100 dark:border-gray-800 py-2">{{ paymentMethodLabel(p.method) }}</div>
                  <div class="border-t border-gray-100 dark:border-gray-800 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400">{{ formatDate(p.receivedAt) }}</div>
                  <div class="border-t border-gray-100 dark:border-gray-800 py-2 text-right">
                    <button @click="removePayment(p.id)" :disabled="savingPayment" class="text-red-500 hover:text-red-700 disabled:opacity-50" title="Remove payment">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div v-if="p.note" class="col-span-4 -mt-1 pb-2 text-xs text-gray-500 dark:text-gray-400">{{ p.note }}</div>
                </template>
              </div>
              <button
                v-if="paymentTotals.paymentStatus !== 'COMPLIMENTARY'"
                @click="showPaymentModal = true"
                class="mt-3 text-sage-600 hover:text-sage-700 text-sm font-medium"
              >
                <i class="fas fa-plus-circle mr-1"></i>Record payment
              </button>
              <div v-if="paymentError" class="mt-2 text-sm text-red-600">{{ paymentError }}</div>
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

        <!-- Therapist's own assessment for this session — full form lives on its
             own focused page; this card is just a status + entry point. -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold"><i class="fas fa-notes-medical mr-2"></i>Pre-Massage Assessment</h2>
            <span :class="['badge', assessmentBadgeClass]">{{ assessmentStatusLabel }}</span>
          </div>
          <div class="card-body flex flex-wrap items-center justify-between gap-4">
            <p class="text-sm text-gray-500">
              <span v-if="assessmentSummary?.signedAt">Signed off by the client {{ formatRelative(assessmentSummary.signedAt) }}.</span>
              <span v-else-if="assessmentSummary">Saved{{ assessmentSummary.updatedAt ? ` ${formatRelative(assessmentSummary.updatedAt)}` : '' }} — not yet signed.</span>
              <span v-else>Record your posture, movement and palpation findings and the treatment plan, then have the client sign.</span>
            </p>
            <RouterLink :to="`/bookings/${booking.id}/pre-massage-assessment`" class="btn-primary text-sm whitespace-nowrap">
              <i class="fas fa-pen-to-square"></i>
              <span>{{ assessmentSummary ? 'Open assessment' : 'Start assessment' }}</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Quick Actions</h3>
          </div>
          <div class="card-body space-y-3">
            <button v-if="!isEditing" @click="isEditing = true" class="btn-secondary w-full text-sm">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button v-if="!isEditing" @click="showSendEmail = true" class="btn-primary w-full text-sm">
              <i class="fas fa-envelope"></i>
              <span>Send Email</span>
            </button>
            <template v-else>
              <button @click="saveBooking" :disabled="saving" class="btn-primary w-full text-sm">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button @click="cancelEdit" class="btn-secondary w-full text-sm">
                Cancel Edit
              </button>
            </template>
            <button v-if="!isEditing && !isBookingPast(booking) && booking.status !== 'CANCELLED'" @click="cancelBooking" :disabled="cancelling" class="btn-danger w-full text-sm">
              <i class="fas fa-trash-alt"></i>
              <span>{{ cancelling ? 'Cancelling...' : 'Cancel Booking' }}</span>
            </button>
            <button v-if="!isEditing && settingsStore.allowDeleteBookings" @click="onDeleteBooking" :disabled="deleting" class="btn-danger w-full text-sm">
              <i class="fas fa-trash-alt"></i>
              <span>{{ deleting ? 'Deleting...' : 'Delete Booking' }}</span>
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
              <p class="text-gray-500">Reference</p>
              <p class="font-medium">{{ bookingRef(booking) }}</p>
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
              <p class="text-gray-500">Payment Status</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['badge uppercase', paymentStatusBadgeClass(paymentTotals.paymentStatus)]">
                  {{ paymentStatusLabel(paymentTotals.paymentStatus) }}
                </span>
                <span v-if="paymentTotals.paymentStatus !== 'COMPLIMENTARY' && paymentTotals.balance > 0" class="text-sm text-red-600">
                  £{{ paymentTotals.balance }} outstanding
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Documents — referral letters etc. for this appointment. Tagged to
             the booking and the client; also visible on the client profile. -->
        <DocumentsPanel v-if="booking.clientId" :client-id="booking.clientId" :booking-id="booking.id" />
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

    <RecordPaymentModal
      v-if="showPaymentModal"
      :saving="savingPayment"
      :suggested-amount="paymentTotals.balance"
      @close="showPaymentModal = false"
      @confirm="recordPayment"
    />

    <CancelBookingModal
      v-if="showCancelModal && booking"
      :booking="booking"
      :saving="cancelling"
      @close="showCancelModal = false"
      @confirm="confirmCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import { useSettingsStore } from '@/stores/settings'
import { useServicesStore } from '@/stores/services'
import { apiService } from '@/services/api'
import type { Booking, IntakeForm, BookingAssessment, PaymentMethod } from '@/types'
import { format, formatDistanceToNow } from 'date-fns'
import { toLondonInputParts, londonWallTimeToUtc, toLondonFakeLocalDate } from '@/utils/formatLondon'
import { bookingTotal } from '@/utils/bookingTotal'
import { computeBookingTotals, paymentMethodLabel, paymentStatusLabel, bookingRef } from '@/utils/bookingTotals'
import ChangeClientModal from '@/components/ChangeClientModal.vue'
import SendEmailModal from '@/components/SendEmailModal.vue'
import RecordPaymentModal from '@/components/RecordPaymentModal.vue'
import CancelBookingModal from '@/components/CancelBookingModal.vue'
import BodyDiagramView from '@/components/BodyDiagramView.vue'
import AvailabilityDatePicker from '@/components/AvailabilityDatePicker.vue'
import DocumentsPanel from '@/components/DocumentsPanel.vue'

const route = useRoute()
const router = useRouter()
const bookingsStore = useBookingsStore()
const settingsStore = useSettingsStore()
const servicesStore = useServicesStore()

const booking = ref<Booking | null>(null)
const showChangeClient = ref(false)
const changeClientError = ref('')
const showSendEmail = ref(false)
const showPaymentModal = ref(false)
const cancelling = ref(false)
const showCancelModal = ref(false)
const deleting = ref(false)
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


// Therapist's pre-massage assessment — summary only; the form lives on its own
// page. Used here to show status and pick the right button label.
const assessmentSummary = ref<BookingAssessment | null>(null)
const assessmentStatusLabel = computed(() => {
  if (assessmentSummary.value?.signedAt) return 'Signed'
  if (assessmentSummary.value) return 'In progress'
  return 'Not started'
})
const assessmentBadgeClass = computed(() => {
  if (assessmentSummary.value?.signedAt) return 'badge-success'
  if (assessmentSummary.value) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
})

async function loadAssessment() {
  if (!booking.value) return
  try {
    assessmentSummary.value = await apiService.getAssessment(booking.value.id)
  } catch {
    assessmentSummary.value = null
  }
}

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
    // therapistUrl carries the validated therapist token, which keeps the form
    // open past the appointment start time (the plain client link locks then).
    const { therapistUrl } = await apiService.getPreFormLink(booking.value.id)
    window.open(therapistUrl, '_blank')
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
const savingPayment = ref(false)
const paymentError = ref('')

// Derived money view (gross/total/balance/status) for the Payments panel.
const paymentTotals = computed(() => computeBookingTotals(booking.value ?? ({} as Booking)))

// Use the same semantic badge classes as getStatusClass so the Payment Status
// pill matches the Status pill exactly (shape, colours, dark mode).
function paymentStatusBadgeClass(status: string): string {
  if (status === 'PAID') return 'badge-success'
  if (status === 'PART_PAID') return 'badge-warning'
  if (status === 'COMPLIMENTARY') return 'bg-purple-100 text-purple-800'
  return 'badge-danger' // DUE
}

// Status banner: label + colour keyed off status, with CANCELLED split into
// Rejected (a declined request) vs Cancelled via cancellationType.
type BannerKind = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
const bannerKind = computed<BannerKind>(() => {
  const b = booking.value
  if (!b) return 'PENDING'
  if (b.status === 'CANCELLED') return b.cancellationType === 'REJECTED' ? 'REJECTED' : 'CANCELLED'
  return b.status as BannerKind
})
const bannerLabel = computed(() => ({
  PENDING: 'Pending review', CONFIRMED: 'Confirmed', COMPLETED: 'Completed',
  REJECTED: 'Rejected', CANCELLED: 'Cancelled',
}[bannerKind.value]))
const bannerClass = computed(() => ({
  PENDING: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  CONFIRMED: 'bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-200',
  COMPLETED: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
  REJECTED: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200',
  CANCELLED: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}[bannerKind.value]))
const bannerIcon = computed(() => ({
  PENDING: 'fa-hourglass-half', CONFIRMED: 'fa-circle-check', COMPLETED: 'fa-flag-checkered',
  REJECTED: 'fa-ban', CANCELLED: 'fa-ban',
}[bannerKind.value]))

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
  extraCharge: null as number | null,
  extraChargeReason: '',
})

function initEditForm() {
  const b = booking.value
  if (!b) return
  const { date: startDate, time: startTime } = toLondonInputParts(b.startTime)
  editForm.startDate = startDate
  editForm.startTime = startTime
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
  editForm.extraCharge = b.extraCharge ?? null
  editForm.extraChargeReason = b.extraChargeReason || ''
}

onMounted(async () => {
  settingsStore.fetchSettings()
  await bookingsStore.fetchBookings()
  const bookingId = route.params.id as string
  booking.value = bookingsStore.bookings.find(b => b.id === bookingId) || null
  initEditForm()
  await loadIntake()
  await loadAssessment()
  if (servicesStore.promotions.length === 0) servicesStore.fetchPromotions()
})

function formatPressure(value?: string | null): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(date?: string): string {
  if (!date) return ''
  return format(toLondonFakeLocalDate(date), 'MMM dd, yyyy')
}

function formatRelative(date?: string): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatTime(date?: string): string {
  if (!date) return ''
  return format(toLondonFakeLocalDate(date), 'h:mm a')
}

function formatDateTime(date?: string): string {
  if (!date) return ''
  return format(toLondonFakeLocalDate(date), 'MMM dd, yyyy h:mm a')
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
  const start = londonWallTimeToUtc(editForm.startDate, editForm.startTime)
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
      extraCharge: Number(editForm.extraCharge) > 0 ? Math.round(Number(editForm.extraCharge)) : null,
      extraChargeReason: Number(editForm.extraCharge) > 0 ? (editForm.extraChargeReason.trim() || null) : null,
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

async function recordPayment(payload: { amount: number; method: PaymentMethod; receivedAt: string; feeAmount: number | null; note: string | null }) {
  if (!booking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    booking.value = await bookingsStore.addPayment(booking.value.id, payload)
    showPaymentModal.value = false
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to record payment'
  } finally {
    savingPayment.value = false
  }
}

async function removePayment(paymentId: string) {
  if (!booking.value) return
  if (!confirm('Remove this payment?')) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    booking.value = await bookingsStore.deletePayment(booking.value.id, paymentId)
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to remove payment'
  } finally {
    savingPayment.value = false
  }
}

function cancelBooking() {
  if (!booking.value) return
  showCancelModal.value = true
}

async function confirmCancel(fee: number) {
  if (!booking.value) return
  cancelling.value = true
  try {
    booking.value = await bookingsStore.cancelBooking(booking.value.id, fee)
    showCancelModal.value = false
  } catch (err: any) {
    alert(err?.message || 'Failed to cancel booking')
  } finally {
    cancelling.value = false
  }
}

// Permanent delete — gated behind the Danger Zone toggle. Distinct from Cancel:
// this removes the record entirely rather than marking it CANCELLED.
async function onDeleteBooking() {
  if (!booking.value) return
  if (!confirm('Permanently delete this booking? This cannot be undone. (Use Cancel instead to keep a record.)')) return
  deleting.value = true
  try {
    await bookingsStore.deleteBooking(booking.value.id)
    router.push('/bookings')
  } catch (err: any) {
    alert(err?.message || 'Failed to delete booking')
  } finally {
    deleting.value = false
  }
}

</script>
