<template>
  <div class="p-8 dark:text-gray-50">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="dark:text-gray-50">Email</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Delivery, SMTP server, and test override
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="saveMessage" class="text-sm text-green-600"
          ><i class="fas fa-check mr-1"></i>{{ saveMessage }}</span
        >
        <button @click="save" :disabled="saving || loading" class="btn-primary">
          <i class="fas fa-floppy-disk"></i>
          <span>{{ saving ? "Saving..." : "Save Changes" }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="saveError"
      class="mb-6 p-3 bg-red-50 border border-red-200 rounded"
    >
      <p class="text-sm text-red-700">{{ saveError }}</p>
    </div>

    <div v-if="loading" class="card p-8 text-center text-gray-500">
      Loading settings...
    </div>

    <div v-else class="space-y-6 max-w-3xl">
      <!-- Email delivery -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">
            <i class="fas fa-envelope mr-2"></i>Email Delivery
          </h2>
        </div>
        <div class="card-body space-y-5">
          <label class="flex items-center gap-3">
            <input
              type="checkbox"
              v-model="form.emailEnabled"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">Emails enabled</span>
            <span class="text-xs text-gray-400"
              >When off, emails are logged but not actually sent.</span
            >
          </label>

          <div class="border-t pt-5 dark:border-gray-700">
            <label class="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                v-model="form.overrideEnabled"
                class="w-4 h-4"
              />
              <span class="text-sm font-medium"
                >Redirect all emails (test override)</span
              >
            </label>
            <input
              v-model="form.overrideEmail"
              type="email"
              class="input-field"
              placeholder="lewis1153@gmail.com"
              :disabled="!form.overrideEnabled"
            />
            <p class="text-xs text-amber-600 mt-1" v-if="form.overrideEnabled">
              <i class="fas fa-triangle-exclamation mr-1"></i>Every outgoing
              email will be sent to this address instead of the real recipient.
              The intended recipient is still recorded in history.
            </p>
          </div>

          <div
            class="border-t pt-5 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >From name</label
              >
              <input
                v-model="form.fromName"
                type="text"
                class="input-field"
                placeholder="LK Bodyworks"
              />
            </div>
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >From email</label
              >
              <input
                v-model="form.fromEmail"
                type="email"
                class="input-field"
                placeholder="hello@lkbodyworks..."
              />
            </div>
            <div class="sm:col-span-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Reply-to email</label
              >
              <input
                v-model="form.replyToEmail"
                type="email"
                class="input-field"
                placeholder="Where client replies should go"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- SMTP -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">
            <i class="fas fa-server mr-2"></i>SMTP Server
          </h2>
        </div>
        <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Host</label
            >
            <input
              v-model="form.smtpHost"
              type="text"
              class="input-field"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Port</label
            >
            <input
              v-model.number="form.smtpPort"
              type="number"
              class="input-field"
              placeholder="587"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Username</label
            >
            <input
              v-model="form.smtpUser"
              type="text"
              class="input-field"
              autocomplete="off"
              placeholder="SMTP username"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
              <span v-if="smtpPassSet" class="text-xs text-gray-400 font-normal"
                >(saved — leave blank to keep)</span
              >
            </label>
            <input
              v-model="smtpPass"
              type="password"
              class="input-field"
              autocomplete="new-password"
              :placeholder="smtpPassSet ? '••••••••' : 'SMTP password'"
            />
          </div>
          <label class="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" v-model="form.smtpSecure" class="w-4 h-4" />
            <span class="text-sm">Use TLS/SSL (secure)</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { apiService } from "@/services/api";
import type { AppSettings } from "@/types";

const loading = ref(true);
const saving = ref(false);
const saveMessage = ref("");
const saveError = ref("");
const smtpPass = ref("");
const smtpPassSet = ref(false);

const form = reactive<Partial<AppSettings>>({
  emailEnabled: false,
  overrideEnabled: false,
  overrideEmail: "",
  fromName: "",
  fromEmail: "",
  replyToEmail: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
});

async function load() {
  loading.value = true;
  try {
    const s = await apiService.getSettings();
    Object.assign(form, {
      emailEnabled: s.emailEnabled,
      overrideEnabled: s.overrideEnabled,
      overrideEmail: s.overrideEmail || "",
      fromName: s.fromName || "",
      fromEmail: s.fromEmail || "",
      replyToEmail: s.replyToEmail || "",
      smtpHost: s.smtpHost || "",
      smtpPort: s.smtpPort || 587,
      smtpSecure: s.smtpSecure,
      smtpUser: s.smtpUser || "",
    });
    smtpPassSet.value = Boolean(s.smtpPassSet);
  } catch (err: any) {
    saveError.value = err?.message || "Failed to load settings";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  saveError.value = "";
  saveMessage.value = "";
  try {
    const payload: Partial<AppSettings> = { ...form };
    // Only send the password if the user typed a new one
    if (smtpPass.value) payload.smtpPass = smtpPass.value;
    const s = await apiService.updateSettings(payload);
    smtpPassSet.value = Boolean(s.smtpPassSet);
    smtpPass.value = "";
    saveMessage.value = "Saved";
    setTimeout(() => (saveMessage.value = ""), 3000);
  } catch (err: any) {
    saveError.value =
      err?.response?.data?.error || err?.message || "Failed to save settings";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
