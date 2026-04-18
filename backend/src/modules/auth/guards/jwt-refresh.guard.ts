import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard bảo vệ endpoint /auth/refresh.
 * Yêu cầu Refresh Token hợp lệ trong Authorization header.
 * Sử dụng: @UseGuards(JwtRefreshGuard)
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
