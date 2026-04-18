import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService): Redis => {
    const client = new Redis({
      host: config.get<string>('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT'),
      password: config.get<string>('REDIS_PASSWORD'),
      // Tự động reconnect khi mất kết nối
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });

    client.on('reconnecting', () => {
      console.warn('⚠️  Redis reconnecting...');
    });

    return client;
  },
  inject: [ConfigService],
};
