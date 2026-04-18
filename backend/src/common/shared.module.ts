import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantStorageService } from './als/tenant-storage.service';
import { redisProvider } from '../providers/redis.provider';
import { EmailService } from './services/email.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    redisProvider,
    RedisService,
    EmailService,
    TenantStorageService,
  ],
  exports: [
    RedisService,
    EmailService,
    TenantStorageService,
  ],
})
export class SharedModule {}
