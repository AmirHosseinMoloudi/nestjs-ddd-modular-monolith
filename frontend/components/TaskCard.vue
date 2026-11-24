<template>
  <div
    @click="$emit('select', task)"
    class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3.5 transition-all shadow-sm hover:shadow cursor-pointer group"
  >
    <div class="flex items-start justify-between gap-2 mb-2">
      <span
        :class="priorityBadgeClass"
        class="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
      >
        {{ task.priority }}
      </span>

      <span class="text-[10px] text-zinc-500 font-mono">
        v{{ task.version }}
      </span>
    </div>

    <h4 class="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
      {{ task.title }}
    </h4>

    <p v-if="task.description" class="text-xs text-zinc-400 mt-1 line-clamp-2">
      {{ task.description }}
    </p>

    <!-- Subtasks Progress -->
    <div v-if="task.subtasks?.length" class="mt-3">
      <div class="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
        <span>Subtasks</span>
        <span>{{ completedSubtasksCount }}/{{ task.subtasks.length }}</span>
      </div>
      <div class="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-blue-500 transition-all duration-300"
          :style="{ width: `${subtasksProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="task.tags?.length" class="flex flex-wrap gap-1 mt-3">
      <span
        v-for="tag in task.tags"
        :key="tag"
        class="text-[10px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- Footer: Assignee & Approval Indicators -->
    <div class="mt-3.5 pt-2.5 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500">
      <div class="flex items-center gap-1.5">
        <div class="h-5 w-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">
          {{ task.assigneeEmail ? task.assigneeEmail[0].toUpperCase() : '?' }}
        </div>
        <span class="text-[11px] truncate max-w-[100px]">
          {{ task.assigneeEmail || 'Unassigned' }}
        </span>
      </div>

      <!-- HITL Maker-Checker Badge -->
      <div v-if="task.requiresApproval" class="flex items-center gap-1">
        <span
          v-if="task.approvalStatus === 'APPROVED'"
          class="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"
          title="Approved by Manager"
        >
          ✓ Approved
        </span>
        <span
          v-else-if="task.approvalStatus === 'PENDING'"
          class="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"
          title="Pending Maker-Checker Signoff"
        >
          ⏱ HITL Req
        </span>
        <span
          v-else-if="task.approvalStatus === 'REJECTED'"
          class="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"
          title="Rejected by Manager"
        >
          ✗ Rejected
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '~/types';

const props = defineProps<{
  task: Task;
}>();

defineEmits(['select']);

const priorityBadgeClass = computed(() => {
  switch (props.task.priority) {
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    default:
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  }
});

const completedSubtasksCount = computed(() => {
  return props.task.subtasks?.filter((s) => s.isCompleted).length || 0;
});

const subtasksProgress = computed(() => {
  if (!props.task.subtasks?.length) return 0;
  return Math.round((completedSubtasksCount.value / props.task.subtasks.length) * 100);
});
</script>
