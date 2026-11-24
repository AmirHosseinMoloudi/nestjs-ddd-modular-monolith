import { defineStore } from 'pinia';
import type { AuditRecord } from '~/types';
import { useAuthStore } from './auth';

export const useAuditStore = defineStore('audit', {
  state: () => ({
    logs: [] as AuditRecord[],
    isLoading: false,
    errorMessage: '',
  }),
  actions: {
    async fetchLogs(entityId?: string) {
      const auth = useAuthStore();
      if (!auth.token) return;

      this.isLoading = true;
      this.errorMessage = '';
      const config = useRuntimeConfig();

      try {
        const query: any = { limit: 100 };
        if (entityId) query.entityId = entityId;

        const res: any = await $fetch(`${config.public.apiBase}/api/v1/audit`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            'x-tenant-id': auth.currentTenantId,
          },
          params: query,
        });

        this.logs = res;
      } catch (err: any) {
        this.errorMessage = err.data?.detail || err.data?.message || 'Failed to fetch audit trail.';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
