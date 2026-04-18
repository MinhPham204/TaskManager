import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  organizationId: string;
}

/**
 * Singleton ALS instance — được import trực tiếp bởi plugin và interceptor.
 * Không phải Injectable vì cần tồn tại trước khi NestJS DI khởi động.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();
