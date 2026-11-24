<template>
  <header class="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            T
          </div>
          <div>
            <span class="font-bold text-white tracking-tight">Enterprise Task Platform</span>
            <span class="ml-2 text-xs text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5">DDD Monolith</span>
          </div>
        </div>

        <!-- Multi-tenant Switcher -->
        <div class="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-800">
          <span class="text-xs text-zinc-400">Tenant:</span>
          <select
            :value="auth.currentTenantId"
            @change="handleTenantChange($event)"
            class="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option v-for="t in auth.tenants" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Observability Quick Links -->
        <a
          :href="grafanaUrl"
          target="_blank"
          class="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 px-2.5 py-1.5 rounded transition"
          title="Open Grafana Dashboards"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Observability</span>
        </a>

        <!-- Audit Trail Trigger -->
        <button
          @click="$emit('openAudit')"
          class="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit Ledger
        </button>

        <!-- New Task Button -->
        <button
          @click="$emit('newTask')"
          class="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded shadow-sm transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Task
        </button>

        <!-- User Profile & Logout -->
        <div class="flex items-center gap-2 pl-3 border-l border-zinc-800">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-medium text-zinc-200">{{ auth.user?.fullName }}</div>
            <div class="text-[10px] text-blue-400 font-mono">{{ auth.user?.role }}</div>
          </div>
          <button
            @click="auth.logout()"
            class="text-xs text-zinc-400 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition"
            title="Sign Out"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useTaskStore } from '~/stores/task';

defineEmits(['newTask', 'openAudit']);

const auth = useAuthStore();
const task = useTaskStore();
const config = useRuntimeConfig();

const grafanaUrl = config.public.grafanaUrl || 'http://localhost:3002';

const handleTenantChange = async (event: any) => {
  const newTenantId = event.target.value;
  auth.setTenant(newTenantId);
  await task.fetchTasks();
  await task.fetchUsers();
};
</script>
