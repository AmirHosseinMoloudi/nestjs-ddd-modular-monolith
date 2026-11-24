import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  tenantId: string;
}

export class TenantContextHolder {
  private static readonly storage = new AsyncLocalStorage<UserContext>();

  public static runWithContext<T>(context: UserContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  public static getContext(): UserContext | undefined {
    return this.storage.getStore();
  }

  public static getTenantId(): string {
    const ctx = this.getContext();
    if (!ctx?.tenantId) {
      throw new Error('Tenant context is missing from current execution scope.');
    }
    return ctx.tenantId;
  }

  public static getUserId(): string {
    const ctx = this.getContext();
    if (!ctx?.userId) {
      throw new Error('User context is missing from current execution scope.');
    }
    return ctx.userId;
  }
}
