import { defineStore } from 'pinia';
import type { Task, TaskPriority, TaskStatus } from '~/types';
import { useAuthStore } from './auth';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [] as Task[],
    total: 0,
    page: 1,
    limit: 50,
    stats: {
      total: 0,
      byStatus: {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      } as Record<string, number>,
    },
    filterStatus: '' as string,
    filterPriority: '' as string,
    searchQuery: '',
    isLoading: false,
    errorMessage: '',
    selectedTask: null as Task | null,
    usersInTenant: [] as { id: string; email: string; fullName: string; role: string }[],
  }),
  getters: {
    filteredTasks: (state) => {
      return state.tasks.filter((t) => {
        if (state.filterStatus && t.status !== state.filterStatus) return false;
        if (state.filterPriority && t.priority !== state.filterPriority) return false;
        if (state.searchQuery) {
          const q = state.searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      });
    },
    tasksByStatus: (state) => {
      const grouped: Record<TaskStatus, Task[]> = {
        TODO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        COMPLETED: [],
        CANCELLED: [],
      };
      for (const t of state.tasks) {
        if (grouped[t.status]) {
          grouped[t.status].push(t);
        }
      }
      return grouped;
    },
  },
  actions: {
    getHeaders() {
      const auth = useAuthStore();
      return {
        Authorization: `Bearer ${auth.token}`,
        'x-tenant-id': auth.currentTenantId,
        'Content-Type': 'application/json',
      };
    },

    async fetchTasks() {
      const auth = useAuthStore();
      if (!auth.token) return;

      this.isLoading = true;
      this.errorMessage = '';
      const config = useRuntimeConfig();

      try {
        const query: any = {
          limit: this.limit,
          page: this.page,
        };
        if (this.filterStatus) query.status = this.filterStatus;
        if (this.filterPriority) query.priority = this.filterPriority;
        if (this.searchQuery) query.search = this.searchQuery;

        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks`, {
          headers: this.getHeaders(),
          params: query,
        });

        this.tasks = res.items;
        this.total = res.total;
        await this.fetchStats();
      } catch (err: any) {
        this.errorMessage = err.data?.detail || err.data?.message || 'Failed to fetch tasks.';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStats() {
      const auth = useAuthStore();
      if (!auth.token) return;
      const config = useRuntimeConfig();

      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/stats`, {
          headers: this.getHeaders(),
        });
        this.stats = res;
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    },

    async fetchUsers() {
      const auth = useAuthStore();
      if (!auth.token) return;
      const config = useRuntimeConfig();

      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/auth/users`, {
          headers: this.getHeaders(),
        });
        this.usersInTenant = res;
      } catch (err) {
        console.error('Failed to fetch tenant users:', err);
      }
    },

    async createTask(payload: {
      title: string;
      description?: string;
      priority: TaskPriority;
      assigneeId?: string;
      assigneeEmail?: string;
      requiresApproval?: boolean;
      tags?: string[];
      subtasks?: { title: string }[];
      deadline?: string;
    }) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: payload,
        });
        this.tasks.unshift(res);
        await this.fetchStats();
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Failed to create task.');
      }
    },

    async updateTask(id: string, payload: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      tags?: string[];
      deadline?: string;
      expectedVersion: number;
    }) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${id}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: payload,
        });

        const idx = this.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === id) {
          this.selectedTask = res;
        }
        await this.fetchStats();
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Failed to update task.');
      }
    },

    async changeStatus(id: string, status: TaskStatus) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${id}/status`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: { status },
        });

        const idx = this.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === id) {
          this.selectedTask = res;
        }
        await this.fetchStats();
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Status transition error.');
      }
    },

    async approveTask(id: string, decision: 'APPROVED' | 'REJECTED', comments?: string) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${id}/approve`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: { decision, comments },
        });

        const idx = this.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === id) {
          this.selectedTask = res;
        }
        await this.fetchStats();
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Approval action failed.');
      }
    },

    async assignTask(id: string, assigneeId: string, assigneeEmail: string) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${id}/assign`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: { assigneeId, assigneeEmail },
        });

        const idx = this.tasks.findIndex((t) => t.id === id);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === id) {
          this.selectedTask = res;
        }
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Assignment failed.');
      }
    },

    async toggleSubtask(taskId: string, subtaskId: string) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
          method: 'PUT',
          headers: this.getHeaders(),
        });

        const idx = this.tasks.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === taskId) {
          this.selectedTask = res;
        }
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Toggle subtask failed.');
      }
    },

    async addSubtask(taskId: string, title: string) {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/tasks/${taskId}/subtasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: { title },
        });

        const idx = this.tasks.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          this.tasks[idx] = res;
        }
        if (this.selectedTask?.id === taskId) {
          this.selectedTask = res;
        }
        return res;
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Add subtask failed.');
      }
    },

    async deleteTask(id: string) {
      const config = useRuntimeConfig();
      try {
        await $fetch(`${config.public.apiBase}/api/v1/tasks/${id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });

        this.tasks = this.tasks.filter((t) => t.id !== id);
        if (this.selectedTask?.id === id) {
          this.selectedTask = null;
        }
        await this.fetchStats();
      } catch (err: any) {
        throw new Error(err.data?.detail || err.data?.message || 'Failed to delete task.');
      }
    },
  },
});
