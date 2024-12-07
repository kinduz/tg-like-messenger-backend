import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDbConfigService } from './database';

@Module({
  imports: [
    UsersModule, 
    AuthModule,     
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      ttl: 5 * 60 * 1000,
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 10 }]),
    TypeOrmModule.forRootAsync({
      useClass: PostgresDbConfigService,
      inject: [PostgresDbConfigService],
    })
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
