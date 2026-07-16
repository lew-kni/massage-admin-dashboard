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
import SettingsView from '@/views/SettingsView.vue'
import ComingSoonView from '@/views/ComingSoonView.vue'

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

  // Settings section
  { path: '/settings', redirect: '/settings/appearance' },
  {
    path: '/settings/appearance',
    name: 'SettingsAppearance',
    component: ComingSoonView,
    props: { title: 'Appearance', subtitle: 'Branding' },
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

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
