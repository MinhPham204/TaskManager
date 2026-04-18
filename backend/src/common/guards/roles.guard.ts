import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user/schemas/user.schema';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — kiểm tra role của user hiện tại (từ req.user.role)
 * so với danh sách role được phép (từ metadata @Roles(...)).
 *
 * Phải dùng SAU JwtAuthGuard (vì cần req.user đã được populate).
 *
 * Nếu endpoint không có @Roles() → guard cho phép tất cả (pass-through).
 *
 * Ví dụ sử dụng:
 *   @Roles(UserRole.ADMIN, UserRole.OWNER)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Patch(':id/approve')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách role được phép từ metadata của handler/class
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không có @Roles() → không hạn chế → cho phép tất cả
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    const userRole = request.user?.role;

    // Kiểm tra role của user có nằm trong danh sách được phép không
    return !!userRole && requiredRoles.includes(userRole);
  }
}
