import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../als/tenant-storage';

/**
 * TenantInterceptor - chạy sau Guards (JwtAuthGuard đã set req.user).
 *
 * Extracts organizationId từ req.user.organization.
 * => Gọi tenantStorage.run() để set ALS context cho toàn bộ request lifecycle.
 *
 * => Mọi Mongoose query trong request tự động có org filter.
 *
 * Public routes (không có user): bỏ qua, không set context.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: Record<string, unknown> }>();

    const user = req.user;
    if (!user) return next.handle();

    const org = user['organization'] as
      | { _id?: { toString(): string } }
      | { toString(): string }
      | null
      | undefined;

    let orgId: string | undefined;
    if (org && typeof org === 'object' && '_id' in org && org._id) {
      orgId = org._id.toString();
    } else if (org) {
      orgId = (org as { toString(): string }).toString();
    }

    if (!orgId) {
      // User chưa thuộc org nào (mới đăng ký)
      return next.handle();
    }

    // Wrap handler trong ALS context -> mọi async operation kế thừa context này
    return new Observable((subscriber) => {
      tenantStorage.run({ organizationId: orgId! }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
