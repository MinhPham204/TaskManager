import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Model } from 'mongoose';
import { Request } from 'express';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { JwtPayload } from './jwt.strategy';

/**
 * JWT Refresh Token Strategy.
 * passReqToCallback=true để lấy raw token từ Authorization header.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');

    const opts: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshSecret || 'temporary_secret_for_debug', // Dùng tạm chuỗi này nếu bị undefined để server không sập
      passReqToCallback: true,
    };
    super(opts);
  }

  /**
   * Validate refresh token: trả về user kèm rawRefreshToken để
   * AuthService.refreshTokens() có thể compare với bcrypt hash trong DB.
   */
  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<(UserDocument & { rawRefreshToken: string }) | null> {
    const authHeader = req.headers['authorization'] as string | undefined;
    const rawRefreshToken = authHeader?.replace('Bearer ', '').trim() ?? '';

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshToken');

    if (!user) return null;

    // Gắn raw token vào object để AuthService so sánh với hash
    const result = user.toObject() as UserDocument & { rawRefreshToken: string };
    result.rawRefreshToken = rawRefreshToken;
    return result;
  }
}
