<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
      <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
        <div>
          <h3 class="text-base font-semibold text-white flex items-center gap-2">
            <span>Immutable Audit Trail & Event Sourcing Store</span>
            <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Append-Only
            </span>
          </h3>
          <p class="text-xs text-zinc-400 mt-0.5">
            Tamper-evident business transactions with before/after state diffs & correlation IDs
          </p>
        </div>

        <button @click="$emit('close')" class="text-zinc-400 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1 space-y-3">
        <div v-if="auditStore.isLoading" class="text-center py-8 text-xs text-zinc-400">
          Loading audit entries...
        </div>

        <div v-else-if="auditStore.logs.length === 0" class="text-center py-8 text-xs text-zinc-500">
          No audit records found for the current tenant.
        </div>

        <div
          v-for="log in auditStore.logs"
          :key="log.id"
          class="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5 space-y-2 text-xs"
        >
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {{ log.action }}
              </span>
              <span class="text-zinc-300 font-medium">{{ log.actorEmail }}</span>
              <span class="text-zinc-500 font-mono text-[11px]">(Entity: {{ log.entityType }}#{{ log.entityId.substring(0, 8) }})</span>
            </div>

            <span class="text-zinc-500 font-mono text-[11px]">
              {{ new Date(log.timestamp).toLocaleString() }}
            </span>
          </div>

          <div v-if="log.correlationId" class="text-[10px] text-zinc-500 font-mono">
            Correlation ID: {{ log.correlationId }}
          </div>

          <!-- Snapshot Comparison -->
          <div v-if="log.beforeSnapshot || log.afterSnapshot" class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-900 text-[11px] font-mono">
            <div v-if="log.beforeSnapshot" class="bg-zinc-900/70 p-2.5 rounded border border-zinc-850">
              <div class="text-[10px] text-red-400 font-semibold mb-1">Before Snapshot:</div>
              <pre class="overflow-x-auto text-zinc-400 text-[10px]">{{ JSON.stringify(log.beforeSnapshot, null, 2) }}</pre>
            </div>
            <div v-if="log.afterSnapshot" class="bg-zinc-900/70 p-2.5 rounded border border-zinc-850">
              <div class="text-[10px] text-emerald-400 font-semibold mb-1">After Snapshot:</div>
              <pre class="overflow-x-auto text-zinc-400 text-[10px]">{{ JSON.stringify(log.afterSnapshot, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
        <span class="text-xs text-zinc-500">
          Total Audit Records: {{ auditStore.logs.length }}
        </span>
        <button
          @click="$emit('close')"
          class="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuditStore } from '~/stores/audit';

defineProps<{
  isOpen: boolean;
}>();

defineEmits(['close']);

const auditStore = useAuditStore();
</script>
