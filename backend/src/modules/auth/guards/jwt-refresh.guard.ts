import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard bảo vệ endpoint /auth/refresh.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
