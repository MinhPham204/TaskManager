import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/user/schemas/user.schema';

export const ROLES_KEY = 'roles';

/**
 * Decorator @Roles(...roles) — gắn metadata danh sách role được phép.
 * Dùng kết hợp với RolesGuard.
 *
 * Flow:
 *   @Roles(UserRole.ADMIN, UserRole.OWNER)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Patch(':id/approve')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
