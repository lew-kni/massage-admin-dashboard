import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ClientsView from '@/views/ClientsView.vue'
import ClientDetailView from '@/views/ClientDetailView.vue'
import BookingsView from '@/views/BookingsView.vue'
import RebookingView from '@/views/RebookingView.vue'
import MarketingView from '@/views/MarketingView.vue'
import MarketingSendView from '@/views/MarketingSendView.vue'
import MarketingTemplatesView from '@/views/MarketingTemplatesView.vue'
import FeedbackDashboardView from '@/views/FeedbackDashboardView.vue'
import FeedbackClientView from '@/views/FeedbackClientView.vue'
import FeedbackSelfView from '@/views/FeedbackSelfView.vue'
import LeadsView from '@/views/LeadsView.vue'
import LeadDetailView from '@/views/LeadDetailView.vue'
import BookingDetailView from '@/views/BookingDetailView.vue'
import AssessmentView from '@/views/AssessmentView.vue'
import ServicesView from '@/views/ServicesView.vue'
import PromotionsView from '@/views/PromotionsView.vue'
import PromotionDetailView from '@/views/PromotionDetailView.vue'
import AvailabilityView from '@/views/AvailabilityView.vue'
import AccountingView from '@/views/AccountingView.vue'
import AccountingExpensesView from '@/views/AccountingExpensesView.vue'
import AccountingReceiptsView from '@/views/AccountingReceiptsView.vue'
import AccountingVendorsView from '@/views/AccountingVendorsView.vue'
import VendorDetailView from '@/views/VendorDetailView.vue'
import SelfAssessmentView from '@/views/SelfAssessmentView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AppearanceView from '@/views/AppearanceView.vue'
import GeneralSettingsView from '@/views/GeneralSettingsView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/leads',
    name: 'Leads',
    component: LeadsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/leads/:id',
    name: 'LeadDetail',
    component: LeadDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/clients',
    name: 'Clients',
    component: ClientsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/clients/:id',
    name: 'ClientDetail',
    component: ClientDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings',
    name: 'Bookings',
    component: BookingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/rebooking',
    name: 'Rebooking',
    component: RebookingView,
    meta: { requiresAuth: true },
  },
  { path: '/marketing', redirect: '/marketing/subscribers' },
  {
    path: '/marketing/subscribers',
    name: 'MarketingSubscribers',
    component: MarketingView,
    meta: { requiresAuth: true },
  },
  {
    path: '/marketing/send',
    name: 'MarketingSend',
    component: MarketingSendView,
    meta: { requiresAuth: true },
  },
  {
    path: '/marketing/templates',
    name: 'MarketingTemplates',
    component: MarketingTemplatesView,
    meta: { requiresAuth: true },
  },
  { path: '/feedback', redirect: '/feedback/dashboard' },
  {
    path: '/feedback/dashboard',
    name: 'FeedbackDashboard',
    component: FeedbackDashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/feedback/client',
    name: 'FeedbackClient',
    component: FeedbackClientView,
    meta: { requiresAuth: true },
  },
  {
    path: '/feedback/self',
    name: 'FeedbackSelf',
    component: FeedbackSelfView,
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings/:id',
    name: 'BookingDetail',
    component: BookingDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/bookings/:id/pre-massage-assessment',
    name: 'BookingAssessment',
    component: AssessmentView,
    meta: { requiresAuth: true },
  },
  // Promotions section (Promotions + Vouchers, split by kind via route meta).
  { path: '/promotions', name: 'Promotions', component: PromotionsView, meta: { requiresAuth: true, kind: 'PROMOTION' } },
  { path: '/promotions/vouchers', name: 'Vouchers', component: PromotionsView, meta: { requiresAuth: true, kind: 'VOUCHER' } },
  // `:id` also covers the 'new' create form; defined after the static children
  // above so '/promotions/vouchers' isn't captured as an id.
  { path: '/promotions/:id', name: 'PromotionDetail', component: PromotionDetailView, meta: { requiresAuth: true } },

  // Accounting section
  { path: '/accounting', redirect: '/accounting/dashboard' },
  {
    path: '/accounting/dashboard',
    name: 'AccountingDashboard',
    component: AccountingView,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounting/receipts',
    name: 'AccountingReceipts',
    component: AccountingReceiptsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounting/vendors',
    name: 'AccountingVendors',
    component: AccountingVendorsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounting/vendors/:id',
    name: 'VendorDetail',
    component: VendorDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounting/expenses',
    name: 'AccountingExpenses',
    component: AccountingExpensesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/accounting/self-assessment',
    name: 'AccountingSelfAssessment',
    component: SelfAssessmentView,
    meta: { requiresAuth: true },
  },

  // Settings section
  { path: '/settings', redirect: '/settings/appearance' },
  {
    path: '/settings/appearance',
    name: 'SettingsAppearance',
    component: AppearanceView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/general',
    name: 'SettingsGeneral',
    component: GeneralSettingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/availability',
    name: 'SettingsAvailability',
    component: AvailabilityView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/services',
    name: 'SettingsServices',
    component: ServicesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings/email',
    name: 'SettingsEmail',
    component: SettingsView,
    meta: { requiresAuth: true },
  },

  // Legacy paths — keep old links working by redirecting into Settings
  { path: '/services', redirect: '/settings/services' },
  { path: '/availability', redirect: '/settings/availability' },
  // Promotions/Vouchers moved out of Settings → Services into their own section.
  { path: '/settings/services/promotions/:id', redirect: (to) => ({ path: `/promotions/${to.params.id}` }) },
  // Email Templates and the standalone Emails page are now tabs within
  // Settings → Email; redirect the old routes so existing links still work.
  { path: '/emails', redirect: '/settings/email' },
  { path: '/settings/email-templates', redirect: { path: '/settings/email', query: { tab: 'templates' } } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // The session lives in an httpOnly cookie we can't inspect, so ask the server
  // once per page load. Without this a refresh would always bounce to /login.
  await authStore.ensureResolved()

  if (requiresAuth && !authStore.isAuthenticated) {
    // Remember where they were headed so sign-in can return them there.
    next({ path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } })
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
