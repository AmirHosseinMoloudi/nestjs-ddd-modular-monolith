import { defineStore } from 'pinia';
import type { User, Tenant } from '~/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as User | null,
    tenants: [] as Tenant[],
    currentTenantId: '11111111-1111-1111-1111-111111111111' as string,
    isLoading: false,
    errorMessage: '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentTenant: (state) => state.tenants.find((t) => t.id === state.currentTenantId) || null,
    canApprove: (state) => state.user?.role === 'ADMIN' || state.user?.role === 'MANAGER',
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    initAuth() {
      if (process.client) {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        const savedTenant = localStorage.getItem('tenant_id');

        if (savedToken && savedUser) {
          try {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            if (savedTenant) this.currentTenantId = savedTenant;
          } catch (e) {
            this.logout();
          }
        }
      }
    },

    async fetchTenants() {
      const config = useRuntimeConfig();
      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/auth/tenants`);
        this.tenants = res;
        if (!this.currentTenantId && res.length > 0) {
          this.currentTenantId = res[0].id;
        }
      } catch (err: any) {
        console.error('Failed to load tenants:', err);
      }
    },

    async login(email: string, password: string, tenantId: string) {
      this.isLoading = true;
      this.errorMessage = '';
      const config = useRuntimeConfig();

      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/auth/login`, {
          method: 'POST',
          body: { email, password, tenantId },
        });

        this.token = res.token;
        this.user = res.user;
        this.currentTenantId = tenantId;

        if (process.client) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          localStorage.setItem('tenant_id', tenantId);
        }

        return true;
      } catch (err: any) {
        this.errorMessage = err.data?.detail || err.data?.message || 'Login failed. Please check credentials.';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async register(payload: { email: string; password: string; fullName: string; tenantId: string; role?: string }) {
      this.isLoading = true;
      this.errorMessage = '';
      const config = useRuntimeConfig();

      try {
        const res: any = await $fetch(`${config.public.apiBase}/api/v1/auth/register`, {
          method: 'POST',
          body: payload,
        });

        this.token = res.token;
        this.user = res.user;
        this.currentTenantId = payload.tenantId;

        if (process.client) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          localStorage.setItem('tenant_id', payload.tenantId);
        }

        return true;
      } catch (err: any) {
        this.errorMessage = err.data?.detail || err.data?.message || 'Registration failed.';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.token = '';
      this.user = null;
      if (process.client) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      navigateTo('/login');
    },

    setTenant(tenantId: string) {
      this.currentTenantId = tenantId;
      if (process.client) {
        localStorage.setItem('tenant_id', tenantId);
      }
    },
  },
});
