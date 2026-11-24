<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
    <Navbar
      @newTask="handleNewTask"
      @openAudit="handleOpenAudit"
    />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- High-Impact KPI Metrics Row -->
      <KpiMetrics />

      <!-- Filter & Controls Toolbar -->
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <!-- Search Input -->
          <div class="relative flex-1 min-w-[180px]">
            <input
              v-model="taskStore.searchQuery"
              @input="debounceSearch"
              placeholder="Search tasks, descriptions, or tags..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 pl-8"
            />
            <svg class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <select
            v-model="taskStore.filterStatus"
            @change="taskStore.fetchTasks()"
            class="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="IN_REVIEW">IN REVIEW (HITL)</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <!-- Priority Filter -->
          <select
            v-model="taskStore.filterPriority"
            @change="taskStore.fetchTasks()"
            class="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <!-- View Switcher (Kanban vs Table) -->
        <div class="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded p-0.5">
          <button
            @click="currentView = 'kanban'"
            :class="currentView === 'kanban' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-2.5 py-1 text-xs rounded transition"
          >
            Kanban Board
          </button>
          <button
            @click="currentView = 'table'"
            :class="currentView === 'table' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-2.5 py-1 text-xs rounded transition"
          >
            Data Table
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="taskStore.isLoading" class="text-center py-16 text-zinc-500 text-xs">
        <div class="inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <div>Synchronizing domain state across aggregates...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="taskStore.tasks.length === 0" class="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl">
        <div class="h-10 w-10 mx-auto rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
          ✓
        </div>
        <h3 class="text-sm font-semibold text-white">No tasks found for current criteria</h3>
        <p class="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          Create your first enterprise task or select a different filter to view domain aggregates.
        </p>
        <button
          @click="handleNewTask"
          class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition"
        >
          Create First Task
        </button>
      </div>

      <!-- Kanban View -->
      <div v-else-if="currentView === 'kanban'" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <!-- Backlog / TODO Column -->
        <div class="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-zinc-500"></span>
              <span class="text-xs font-semibold text-zinc-300">TODO</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
              {{ taskStore.tasksByStatus.TODO.length }}
            </span>
          </div>
          <div class="space-y-2.5">
            <TaskCard
              v-for="t in taskStore.tasksByStatus.TODO"
              :key="t.id"
              :task="t"
              @select="openTaskDetail"
            />
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-blue-500"></span>
              <span class="text-xs font-semibold text-blue-400">IN PROGRESS</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
              {{ taskStore.tasksByStatus.IN_PROGRESS.length }}
            </span>
          </div>
          <div class="space-y-2.5">
            <TaskCard
              v-for="t in taskStore.tasksByStatus.IN_PROGRESS"
              :key="t.id"
              :task="t"
              @select="openTaskDetail"
            />
          </div>
        </div>

        <!-- In Review (HITL) Column -->
        <div class="bg-zinc-950/60 border border-amber-500/20 rounded-xl p-3 space-y-3 bg-amber-500/5">
          <div class="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span class="text-xs font-semibold text-amber-300">IN REVIEW (HITL)</span>
            </div>
            <span class="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {{ taskStore.tasksByStatus.IN_REVIEW.length }}
            </span>
          </div>
          <div class="space-y-2.5">
            <TaskCard
              v-for="t in taskStore.tasksByStatus.IN_REVIEW"
              :key="t.id"
              :task="t"
              @select="openTaskDetail"
            />
          </div>
        </div>

        <!-- Completed Column -->
        <div class="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-semibold text-emerald-400">COMPLETED</span>
            </div>
            <span class="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
              {{ taskStore.tasksByStatus.COMPLETED.length }}
            </span>
          </div>
          <div class="space-y-2.5">
            <TaskCard
              v-for="t in taskStore.tasksByStatus.COMPLETED"
              :key="t.id"
              :task="t"
              @select="openTaskDetail"
            />
          </div>
        </div>
      </div>

      <!-- Data Table View -->
      <div v-else class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-300">
            <thead class="bg-zinc-950/80 border-b border-zinc-800 uppercase tracking-wider text-[10px] text-zinc-400">
              <tr>
                <th class="px-4 py-3">Title</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Priority</th>
                <th class="px-4 py-3">Assignee</th>
                <th class="px-4 py-3">Approval</th>
                <th class="px-4 py-3">Version</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              <tr
                v-for="t in taskStore.filteredTasks"
                :key="t.id"
                @click="openTaskDetail(t)"
                class="hover:bg-zinc-800/50 cursor-pointer transition"
              >
                <td class="px-4 py-3 font-medium text-white max-w-xs truncate">{{ t.title }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300">
                    {{ t.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span :class="getPriorityBadge(t.priority)" class="px-2 py-0.5 rounded text-[10px] font-bold">
                    {{ t.priority }}
                  </span>
                </td>
                <td class="px-4 py-3 text-zinc-400">{{ t.assigneeEmail || 'Unassigned' }}</td>
                <td class="px-4 py-3">
                  <span v-if="t.requiresApproval" class="text-[10px] font-mono text-amber-400">
                    {{ t.approvalStatus }}
                  </span>
                  <span v-else class="text-[10px] text-zinc-500">Not required</span>
                </td>
                <td class="px-4 py-3 font-mono text-[10px] text-zinc-500">v{{ t.version }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click.stop="openTaskDetail(t)"
                    class="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <TaskModal
      :isOpen="isTaskModalOpen"
      :taskToEdit="taskToEdit"
      @close="isTaskModalOpen = false; taskToEdit = null"
      @saved="taskStore.fetchTasks()"
    />

    <TaskDetailModal
      :isOpen="isDetailModalOpen"
      :task="taskStore.selectedTask"
      @close="isDetailModalOpen = false; taskStore.selectedTask = null"
      @edit="handleEditFromDetail"
      @updated="handleTaskUpdated"
    />

    <AuditModal
      :isOpen="isAuditModalOpen"
      @close="isAuditModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useTaskStore } from '~/stores/task';
import { useAuditStore } from '~/stores/audit';
import type { Task } from '~/types';

const auth = useAuthStore();
const taskStore = useTaskStore();
const auditStore = useAuditStore();

const currentView = ref<'kanban' | 'table'>('kanban');
const isTaskModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isAuditModalOpen = ref(false);
const taskToEdit = ref<Task | null>(null);

let searchTimeout: any = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    taskStore.fetchTasks();
  }, 300);
};

onMounted(async () => {
  auth.initAuth();
  if (!auth.isAuthenticated) {
    navigateTo('/login');
    return;
  }
  await auth.fetchTenants();
  await taskStore.fetchTasks();
  await taskStore.fetchUsers();
});

const handleNewTask = () => {
  taskToEdit.value = null;
  isTaskModalOpen.value = true;
};

const openTaskDetail = (task: Task) => {
  taskStore.selectedTask = task;
  isDetailModalOpen.value = true;
};

const handleEditFromDetail = (task: Task) => {
  isDetailModalOpen.value = false;
  taskToEdit.value = task;
  isTaskModalOpen.value = true;
};

const handleTaskUpdated = (updated: Task) => {
  taskStore.selectedTask = updated;
};

const handleOpenAudit = async () => {
  await auditStore.fetchLogs();
  isAuditModalOpen.value = true;
};

const getPriorityBadge = (p: string) => {
  switch (p) {
    case 'CRITICAL': return 'bg-red-500/10 text-red-400';
    case 'HIGH': return 'bg-amber-500/10 text-amber-400';
    case 'MEDIUM': return 'bg-blue-500/10 text-blue-400';
    default: return 'bg-zinc-800 text-zinc-400';
  }
};
</script>
