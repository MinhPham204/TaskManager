import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { UserModule } from '../user/user.module';
import { Organization, OrganizationSchema } from '../organization/schemas/organization.schema';
import { User, UserSchema } from '../user/schemas/user.schema';


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),

    // JwtModule: cấu hình access token mặc định
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') as string,
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),

    // UserModule export MongooseModule(User) → strategies có thể @InjectModel(User)
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtRefreshGuard,
    JwtModule,
  ],
})
export class AuthModule { }
