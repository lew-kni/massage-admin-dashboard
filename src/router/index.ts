import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ClientsView from '@/views/ClientsView.vue'
import ClientDetailView from '@/views/ClientDetailView.vue'
import BookingsView from '@/views/BookingsView.vue'
import LeadsView from '@/views/LeadsView.vue'
import LeadDetailView from '@/views/LeadDetailView.vue'
import BookingDetailView from '@/views/BookingDetailView.vue'
import AssessmentView from '@/views/AssessmentView.vue'
import ServicesView from '@/views/ServicesView.vue'
import AvailabilityView from '@/views/AvailabilityView.vue'
import AccountingView from '@/views/AccountingView.vue'
import AccountingExpensesView from '@/views/AccountingExpensesView.vue'
import AccountingReceiptsView from '@/views/AccountingReceiptsView.vue'
import SelfAssessmentView from '@/views/SelfAssessmentView.vue'
import SettingsView from '@/views/SettingsView.vue'
import AppearanceView from '@/views/AppearanceView.vue'
import GeneralSettingsView from '@/views/GeneralSettingsView.vue'

const routes = [
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
