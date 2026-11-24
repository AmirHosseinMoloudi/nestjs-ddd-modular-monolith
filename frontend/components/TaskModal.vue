<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
      <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 class="text-base font-semibold text-white">
          {{ isEdit ? 'Edit Task (OCC Protected)' : 'Create Enterprise Task' }}
        </h3>
        <button @click="$emit('close')" class="text-zinc-400 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Title *</label>
          <input
            v-model="form.title"
            required
            maxlength="150"
            placeholder="e.g. Audit Payment Gateway Settlement"
            class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Detailed requirements, invariants or verification steps..."
            class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1">Priority</label>
            <select
              v-model="form.priority"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL (Enforces Approval)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-300 mb-1">Assignee</label>
            <select
              v-model="form.assigneeId"
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Unassigned</option>
              <option v-for="u in taskStore.usersInTenant" :key="u.id" :value="u.id">
                {{ u.fullName }} ({{ u.role }})
              </option>
            </select>
          </div>
        </div>

        <!-- Approval Requirement Switch -->
        <div class="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-zinc-200">Maker-Checker Approval Workflow</div>
            <div class="text-[11px] text-zinc-500">Requires second-party manager signoff before completion</div>
          </div>
          <input
            type="checkbox"
            v-model="form.requiresApproval"
            :disabled="form.priority === 'CRITICAL'"
            class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Tags (comma-separated)</label>
          <input
            v-model="tagsInput"
            placeholder="security, financial, release, sprint-42"
            class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div class="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition disabled:opacity-50"
          >
            {{ isSubmitting ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Task, TaskPriority } from '~/types';
import { useTaskStore } from '~/stores/task';

const props = defineProps<{
  isOpen: boolean;
  taskToEdit?: Task | null;
}>();

const emit = defineEmits(['close', 'saved']);

const taskStore = useTaskStore();
const isSubmitting = ref(false);
const error = ref('');

const isEdit = computed(() => !!props.taskToEdit);

const form = ref({
  title: '',
  description: '',
  priority: 'MEDIUM' as TaskPriority,
  assigneeId: '',
  requiresApproval: false,
});

const tagsInput = ref('');

watch(
  () => props.taskToEdit,
  (task) => {
    if (task) {
      form.value = {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assigneeId: task.assigneeId || '',
        requiresApproval: task.requiresApproval,
      };
      tagsInput.value = task.tags?.join(', ') || '';
    } else {
      form.value = {
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        requiresApproval: false,
      };
      tagsInput.value = '';
    }
    error.value = '';
  },
  { immediate: true },
);

const handleSubmit = async () => {
  isSubmitting.value = true;
  error.value = '';

  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const selectedUser = taskStore.usersInTenant.find((u) => u.id === form.value.assigneeId);

  try {
    if (isEdit.value && props.taskToEdit) {
      await taskStore.updateTask(props.taskToEdit.id, {
        title: form.value.title,
        description: form.value.description,
        priority: form.value.priority,
        tags,
        expectedVersion: props.taskToEdit.version,
      });
    } else {
      await taskStore.createTask({
        title: form.value.title,
        description: form.value.description,
        priority: form.value.priority,
        assigneeId: form.value.assigneeId || undefined,
        assigneeEmail: selectedUser?.email,
        requiresApproval: form.value.requiresApproval,
        tags,
      });
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    error.value = err.message || 'Operation failed.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
