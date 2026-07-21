<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center sticky top-0 bg-white">
        <h2 class="text-lg font-semibold">{{ isEditMode ? 'Edit Client' : 'New Client' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-6">
        <!-- Name Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              class="input-field"
              required
            />
          </div>
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              class="input-field"
              required
            />
          </div>
        </div>

        <!-- Contact Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input-field"
              required
            />
          </div>
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="input-field"
            />
          </div>
        </div>

        <!-- Personal Info Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="dateOfBirth" class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              v-model="form.dateOfBirth"
              type="date"
              class="input-field"
            />
          </div>
          <div>
            <label for="postcode" class="block text-sm font-medium text-gray-700 mb-1">
              Postcode
            </label>
            <input
              id="postcode"
              v-model="form.postcode"
              type="text"
              class="input-field"
            />
          </div>
        </div>

        <!-- Address Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              id="address"
              v-model="form.address"
              type="text"
              class="input-field"
            />
          </div>
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              id="city"
              v-model="form.city"
              type="text"
              class="input-field"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
          >
            <span v-if="loading">Saving...</span>
            <span v-else>{{ isEditMode ? 'Update Client' : 'Create Client' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useClientsStore } from '@/stores/clients'
import type { Client } from '@/types'

const emit = defineEmits<{
  close: []
  saved: [client: Client]
}>()

const props = withDefaults(
  defineProps<{
    client?: Client
  }>(),
  { client: undefined }
)

const clientsStore = useClientsStore()
const loading = ref(false)
const error = ref('')

const isEditMode = computed(() => !!props.client)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  city: '',
  postcode: '',
})

function initializeForm() {
  form.firstName = props.client?.firstName || ''
  form.lastName = props.client?.lastName || ''
  form.email = props.client?.email || ''
  form.phone = props.client?.phone || ''
  form.dateOfBirth = props.client?.dateOfBirth || ''
  form.address = props.client?.address || ''
  form.city = props.client?.city || ''
  form.postcode = props.client?.postcode || ''
}

// Initialize form when component mounts or when client prop changes
watch(() => props.client, () => {
  initializeForm()
}, { immediate: true })

async function submitForm() {
  if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
    error.value = 'First name, last name, and email are required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
    }

    // Only include optional fields if they have non-empty trimmed values
    if (form.phone?.trim()) payload.phone = form.phone.trim()
    if (form.address?.trim()) payload.address = form.address.trim()
    if (form.city?.trim()) payload.city = form.city.trim()
    if (form.postcode?.trim()) payload.postcode = form.postcode.trim()
    if (form.dateOfBirth?.trim()) payload.dateOfBirth = form.dateOfBirth.trim()
    // Notes are managed separately in the detail view, not in this form

    let saved: Client

    if (isEditMode.value) {
      saved = await clientsStore.updateClient(props.client!.id, payload)
    } else {
      saved = await clientsStore.createClient(payload)
    }

    emit('saved', saved)
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save client'
  } finally {
    loading.value = false
  }
}
</script>
