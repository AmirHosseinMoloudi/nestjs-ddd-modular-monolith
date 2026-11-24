<template>
  <div v-if="isOpen && task" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div class="flex items-center gap-2.5">
          <span
            :class="priorityBadgeClass"
            class="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
          >
            {{ task.priority }}
          </span>
          <span class="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            v{{ task.version }} OCC
          </span>
          <span class="text-xs text-zinc-500 font-mono">
            ID: {{ task.id.substring(0, 8) }}...
          </span>
        </div>

        <button @click="$emit('close')" class="text-zinc-400 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {{ error }}
        </div>
        <div v-if="successMsg" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
          {{ successMsg }}
        </div>

        <!-- Title & Description -->
        <div>
          <h2 class="text-lg font-bold text-white tracking-tight">{{ task.title }}</h2>
          <p class="text-xs text-zinc-400 mt-2 whitespace-pre-wrap leading-relaxed">
            {{ task.description || 'No detailed description provided.' }}
          </p>
        </div>

        <!-- Maker-Checker Approval Status Banner & Action -->
        <div v-if="task.requiresApproval" class="p-4 rounded-lg border bg-zinc-950/90" :class="approvalBannerBorder">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-white">Maker-Checker Policy (HITL)</span>
                <span :class="approvalStatusClass" class="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  {{ task.approvalStatus }}
                </span>
              </div>
              <p class="text-[11px] text-zinc-400 mt-1">
                Creator: <span class="font-mono text-zinc-300">{{ task.creatorId === auth.user?.id ? 'You (Maker)' : task.creatorId }}</span>
                | Assignee: <span class="font-mono text-zinc-300">{{ task.assigneeEmail || 'None' }}</span>
              </p>
              <p v-if="task.approvalComment" class="text-[11px] text-zinc-300 mt-2 bg-zinc-900 p-2 rounded border border-zinc-800">
                <span class="text-zinc-500">Signoff Comment:</span> "{{ task.approvalComment }}"
              </p>
            </div>
          </div>

          <!-- Maker-Checker Action Form -->
          <div v-if="task.approvalStatus === 'PENDING'" class="mt-4 pt-3 border-t border-zinc-800">
            <div v-if="isCreatorOrAssignee" class="text-xs text-amber-400/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
              ⚠️ Strict Separation of Duties: As the task Maker / Assignee, you cannot self-approve this task. A manager must review it.
            </div>

            <div v-else-if="auth.canApprove" class="space-y-2">
              <label class="block text-xs font-medium text-zinc-300">Manager Signoff Decision</label>
              <input
                v-model="approvalComment"
                placeholder="Audit review notes / approval comment..."
                class="w-full bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div class="flex items-center gap-2 pt-1">
                <button
                  @click="handleApproval('APPROVED')"
                  :disabled="isProcessing"
                  class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                >
                  ✓ Approve & Complete
                </button>
                <button
                  @click="handleApproval('REJECTED')"
                  :disabled="isProcessing"
                  class="px-3 py-1.5 text-xs font-medium bg-red-600/80 hover:bg-red-600 text-white rounded transition"
                >
                  ✗ Reject Signoff
                </button>
              </div>
            </div>

            <div v-else class="text-xs text-zinc-500">
              Manager or Administrator credentials required to sign off.
            </div>
          </div>
        </div>

        <!-- FSM State Transition Controls -->
        <div>
          <label class="block text-xs font-medium text-zinc-400 mb-2">Lifecycle State Machine</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="st in availableStatuses"
              :key="st"
              @click="handleStatusChange(st)"
              :disabled="task.status === st || isProcessing || isTerminal"
              :class="[
                task.status === st ? 'bg-blue-600 text-white font-medium border-blue-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700',
                isTerminal && task.status !== st ? 'opacity-40 cursor-not-allowed' : ''
              ]"
              class="text-xs px-3 py-1.5 rounded border transition flex items-center gap-1"
            >
              <span v-if="task.status === st">●</span>
              <span>{{ st }}</span>
            </button>
          </div>
          <p v-if="isTerminal" class="text-[11px] text-zinc-500 mt-1.5">
            This task has reached terminal status ({{ task.status }}). No further transitions permitted by domain invariants.
          </p>
        </div>

        <!-- Subtasks Checklist -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-zinc-400">Subtasks & Work Breakdown</label>
            <span class="text-[11px] text-zinc-500">{{ completedCount }}/{{ task.subtasks?.length || 0 }} completed</span>
          </div>

          <div class="space-y-1.5">
            <div
              v-for="sub in task.subtasks"
              :key="sub.id"
              @click="handleToggleSubtask(sub.id)"
              class="flex items-center gap-2 p-2 bg-zinc-950/70 border border-zinc-800 rounded hover:border-zinc-700 cursor-pointer transition"
            >
              <input
                type="checkbox"
                :checked="sub.isCompleted"
                class="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-blue-600 pointer-events-none"
              />
              <span :class="sub.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'" class="text-xs">
                {{ sub.title }}
              </span>
            </div>

            <!-- Add Subtask Inline -->
            <div class="flex items-center gap-2 mt-2">
              <input
                v-model="newSubtaskTitle"
                @keyup.enter="handleAddSubtask"
                placeholder="Add subtask and press Enter..."
                class="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                @click="handleAddSubtask"
                class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded border border-zinc-700 transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <!-- Meta Details Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs border-t border-zinc-800 pt-4">
          <div>
            <span class="text-zinc-500">Created:</span>
            <div class="text-zinc-300 font-mono text-[11px] mt-0.5">{{ new Date(task.createdAt).toLocaleString() }}</div>
          </div>
          <div>
            <span class="text-zinc-500">Last Modified:</span>
            <div class="text-zinc-300 font-mono text-[11px] mt-0.5">{{ new Date(task.updatedAt).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
        <button
          @click="handleDelete"
          :disabled="isProcessing"
          class="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Task
        </button>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('edit', task)"
            class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded border border-zinc-700 transition"
          >
            Edit Details
          </button>
          <button
            @click="$emit('close')"
            class="px-3.5 py-1.5 bg-zinc-800 text-zinc-200 hover:text-white text-xs rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Task, TaskStatus } from '~/types';
import { useTaskStore } from '~/stores/task';
import { useAuthStore } from '~/stores/auth';

const props = defineProps<{
  isOpen: boolean;
  task: Task | null;
}>();

const emit = defineEmits(['close', 'edit', 'updated']);

const taskStore = useTaskStore();
const auth = useAuthStore();

const isProcessing = ref(false);
const error = ref('');
const successMsg = ref('');
const approvalComment = ref('');
const newSubtaskTitle = ref('');

const availableStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];

const isTerminal = computed(() => {
  return props.task?.status === 'COMPLETED' || props.task?.status === 'CANCELLED';
});

const isCreatorOrAssignee = computed(() => {
  if (!props.task || !auth.user) return false;
  return props.task.creatorId === auth.user.id || props.task.assigneeId === auth.user.id;
});

const priorityBadgeClass = computed(() => {
  switch (props.task?.priority) {
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

const approvalBannerBorder = computed(() => {
  switch (props.task?.approvalStatus) {
    case 'APPROVED': return 'border-emerald-500/30';
    case 'PENDING': return 'border-amber-500/30';
    case 'REJECTED': return 'border-red-500/30';
    default: return 'border-zinc-800';
  }
});

const approvalStatusClass = computed(() => {
  switch (props.task?.approvalStatus) {
    case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400';
    case 'PENDING': return 'bg-amber-500/20 text-amber-400';
    case 'REJECTED': return 'bg-red-500/20 text-red-400';
    default: return 'bg-zinc-800 text-zinc-400';
  }
});

const completedCount = computed(() => {
  return props.task?.subtasks?.filter((s) => s.isCompleted).length || 0;
});

const handleStatusChange = async (newStatus: TaskStatus) => {
  if (!props.task) return;
  isProcessing.value = true;
  error.value = '';
  successMsg.value = '';

  try {
    const updated = await taskStore.changeStatus(props.task.id, newStatus);
    successMsg.value = `Task transitioned to ${newStatus}`;
    emit('updated', updated);
  } catch (err: any) {
    error.value = err.message || 'Status transition failed.';
  } finally {
    isProcessing.value = false;
  }
};

const handleApproval = async (decision: 'APPROVED' | 'REJECTED') => {
  if (!props.task) return;
  isProcessing.value = true;
  error.value = '';
  successMsg.value = '';

  try {
    const updated = await taskStore.approveTask(props.task.id, decision, approvalComment.value);
    successMsg.value = `Approval signoff recorded: ${decision}`;
    approvalComment.value = '';
    emit('updated', updated);
  } catch (err: any) {
    error.value = err.message || 'Approval signoff failed.';
  } finally {
    isProcessing.value = false;
  }
};

const handleToggleSubtask = async (subtaskId: string) => {
  if (!props.task) return;
  try {
    await taskStore.toggleSubtask(props.task.id, subtaskId);
  } catch (err: any) {
    error.value = err.message || 'Toggle subtask failed.';
  }
};

const handleAddSubtask = async () => {
  if (!props.task || !newSubtaskTitle.value.trim()) return;
  try {
    await taskStore.addSubtask(props.task.id, newSubtaskTitle.value.trim());
    newSubtaskTitle.value = '';
  } catch (err: any) {
    error.value = err.message || 'Add subtask failed.';
  }
};

const handleDelete = async () => {
  if (!props.task) return;
  if (!confirm(`Are you sure you want to delete task "${props.task.title}"? This action is audited.`)) return;

  isProcessing.value = true;
  try {
    await taskStore.deleteTask(props.task.id);
    emit('close');
  } catch (err: any) {
    error.value = err.message || 'Failed to delete task.';
  } finally {
    isProcessing.value = false;
  }
};
</script>
