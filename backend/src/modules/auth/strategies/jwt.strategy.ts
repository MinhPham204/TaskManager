import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is missing in .env file!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Gọi sau khi passport verify JWT thành công
   * Return value gắn vào req.user.
   */
  async validate(payload: JwtPayload): Promise<UserDocument | null> {
    const user = await this.userModel
      .findById(payload.sub)
      .select('-password')
      .populate('organization', 'name slug plan isActive');

      if (!user || user.isActive === false) {
        throw new UnauthorizedException('User not found or inactive');
      }

    return user;
  }
}
