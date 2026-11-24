<template>
  <div class="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/20 mb-3">
        T
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-white">Enterprise Task Platform</h2>
      <p class="text-xs text-zinc-400 mt-1">
        Modular Monolith DDD Architecture • Hexagonal Ports & Adapters • OpenTelemetry
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-zinc-900 border border-zinc-800 py-8 px-4 shadow-xl rounded-xl sm:px-10">
        <!-- Tab selector -->
        <div class="flex border-b border-zinc-800 mb-6">
          <button
            @click="isRegister = false"
            :class="!isRegister ? 'border-b-2 border-blue-500 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'"
            class="flex-1 pb-3 text-xs text-center transition"
          >
            Sign In
          </button>
          <button
            @click="isRegister = true"
            :class="isRegister ? 'border-b-2 border-blue-500 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'"
            class="flex-1 pb-3 text-xs text-center transition"
          >
            Register New Principal
          </button>
        </div>

        <div v-if="auth.errorMessage" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {{ auth.errorMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Tenant Dropdown -->
          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1">Target Tenant Organization *</label>
            <select
              v-model="tenantId"
              required
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option v-for="t in auth.tenants" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.slug }})
              </option>
            </select>
          </div>

          <div v-if="isRegister">
            <label class="block text-xs font-medium text-zinc-300 mb-1">Full Name *</label>
            <input
              v-model="fullName"
              required
              placeholder="e.g. David Engineer"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1">Email Address *</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="name@domain.com"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1">Password *</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div v-if="isRegister">
            <label class="block text-xs font-medium text-zinc-300 mb-1">Assigned Role</label>
            <select
              v-model="selectedRole"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="USER">USER (Developer/Operator)</option>
              <option value="MANAGER">MANAGER (Approver / Signoff)</option>
              <option value="ADMIN">ADMIN (Full Governance)</option>
            </select>
          </div>

          <button
            type="submit"
            :disabled="auth.isLoading"
            class="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {{ auth.isLoading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Authenticate Principal' }}
          </button>
        </form>

        <!-- Quick 1-Click Demo Profiles -->
        <div class="mt-6 pt-5 border-t border-zinc-800">
          <div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Instant Demo Profiles (Pre-seeded):
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="quickLogin('admin@acme.com', 'Password123!')"
              class="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-center transition"
            >
              <div class="text-[11px] font-bold text-red-400">Alice</div>
              <div class="text-[9px] text-zinc-500">ADMIN</div>
            </button>
            <button
              type="button"
              @click="quickLogin('manager@acme.com', 'Password123!')"
              class="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-center transition"
            >
              <div class="text-[11px] font-bold text-amber-400">Bob</div>
              <div class="text-[9px] text-zinc-500">MANAGER</div>
            </button>
            <button
              type="button"
              @click="quickLogin('user@acme.com', 'Password123!')"
              class="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-center transition"
            >
              <div class="text-[11px] font-bold text-blue-400">Charlie</div>
              <div class="text-[9px] text-zinc-500">USER</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();

const isRegister = ref(false);
const email = ref('');
const password = ref('');
const fullName = ref('');
const tenantId = ref('');
const selectedRole = ref('USER');

onMounted(async () => {
  await auth.fetchTenants();
  if (auth.tenants.length > 0) {
    tenantId.value = auth.tenants[0].id;
  }
});

const handleSubmit = async () => {
  if (isRegister.value) {
    const success = await auth.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value,
      tenantId: tenantId.value,
      role: selectedRole.value,
    });
    if (success) navigateTo('/');
  } else {
    const success = await auth.login(email.value, password.value, tenantId.value);
    if (success) navigateTo('/');
  }
};

const quickLogin = async (em: string, pw: string) => {
  email.value = em;
  password.value = pw;
  if (!tenantId.value && auth.tenants.length > 0) {
    tenantId.value = auth.tenants[0].id;
  }
  const success = await auth.login(em, pw, tenantId.value);
  if (success) navigateTo('/');
};
</script>
