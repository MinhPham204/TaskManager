import { ForbiddenException, Injectable } from '@nestjs/common';
import { tenantStorage, TenantStore } from './tenant-storage';

/**
 * NestJS-injectable wrapper cho tenantStorage.
 * Dùng khi cần inject vào service thông thường.
 */
@Injectable()
export class TenantStorageService {
  /** Lấy organizationId của request hiện tại. Trả null nếu không có context. */
  getOrganizationId(): string | null {
    return tenantStorage.getStore()?.organizationId ?? null;
  }

  getStore(): TenantStore | undefined {
    return tenantStorage.getStore();
  }

  /**
   * Lấy organizationId và ném lỗi rõ ràng nếu user chưa có organization.
   * Dùng trong TaskService/TeamService để tránh lỗi Mongoose ValidationError khó hiểu.
   */
  requireOrganizationId(): string {
    const orgId = this.getOrganizationId();
    if (!orgId) {
      throw new ForbiddenException(
        'You must belong to an organization to perform this action. ' +
          'Please create or join an organization first via POST /api/v1/organizations.',
      );
    }
    return orgId;
  }

  /** Chạy callback trong ALS context của một tenant cụ thể. */
  run<T>(organizationId: string, fn: () => T): T {
    return tenantStorage.run({ organizationId }, fn);
  }
}
