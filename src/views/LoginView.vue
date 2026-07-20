<template>
  <div class="min-h-screen bg-gradient-to-br from-sage-50 to-sky-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="mb-8 text-center">
          <img
            src="/logo.png"
            alt="North Peak Massage"
            width="220"
            height="155"
            class="w-[220px] h-auto mx-auto"
          />
          <p class="text-[0.7rem] uppercase tracking-[0.22em] text-gray-400 mt-4">Admin Dashboard</p>
        </div>

        <div v-if="!clientId" class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-sm text-amber-800">
            <i class="fas fa-triangle-exclamation mr-1"></i>
            Google sign-in isn't configured. Set <code class="font-mono">VITE_GOOGLE_CLIENT_ID</code>
            in the admin's <code class="font-mono">.env</code> and restart the dev server.
          </p>
        </div>

        <template v-else>
          <p class="text-sm text-gray-500 text-center mb-6">
            Sign in with the authorised Google account to continue.
          </p>

          <!-- Google renders its own button into this element -->
          <div class="flex justify-center min-h-[44px]">
            <div ref="buttonHost"></div>
          </div>

          <div v-if="loading" class="mt-4 text-center text-sm text-gray-500">
            <i class="fas fa-circle-notch fa-spin mr-1"></i>Signing you in…
          </div>

          <div v-if="scriptError" class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-sm text-amber-800">
              Couldn't load Google sign-in. Check your connection or any content blockers, then reload.
            </p>
          </div>
        </template>

        <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const buttonHost = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref('')
const scriptError = ref(false)

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Load the Google Identity Services script once, resolving when it's ready.
function loadGsi(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('GSI failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('GSI failed to load'))
    document.head.appendChild(script)
  })
}

async function handleCredential(response: { credential?: string }) {
  if (!response?.credential) {
    error.value = 'Google did not return a credential. Please try again.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.loginWithGoogle(response.credential)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 403) {
      error.value = 'That Google account is not authorised to use this admin.'
    } else if (status === 429) {
      error.value = 'Too many sign-in attempts. Please wait a few minutes and try again.'
    } else {
      error.value = err?.response?.data?.error || 'Sign-in failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!clientId) return
  try {
    await loadGsi()
  } catch {
    scriptError.value = true
    return
  }

  const google = (window as any).google
  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredential,
    // Prevents the token being replayed against a different site.
    auto_select: false,
    cancel_on_tap_outside: true,
  })
  google.accounts.id.renderButton(buttonHost.value, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 320,
  })
})
</script>
