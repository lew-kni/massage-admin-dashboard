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
import ServicesView from '@/views/ServicesView.vue'
import AvailabilityView from '@/views/AvailabilityView.vue'
import EmailsView from '@/views/EmailsView.vue'
import AccountingView from '@/views/AccountingView.vue'
import AccountingExpensesView from '@/views/AccountingExpensesView.vue'
import AccountingReceiptsView from '@/views/AccountingReceiptsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ComingSoonView from '@/views/ComingSoonView.vue'
import AppearanceView from '@/views/AppearanceView.vue'

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
    path: '/emails',
    name: 'Emails',
    component: EmailsView,
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
    component: ComingSoonView,
    props: { title: 'General', subtitle: 'Contact Information' },
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
