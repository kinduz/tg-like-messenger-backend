import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/jwt.entity';
import { OtpCode } from 'src/auth/entities/otp.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PostgresDbConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('POSTGRES_HOST'),
      port: 5432,
      username: this.configService.get<string>('POSTGRES_USERNAME'),
      password: this.configService.get<string>('POSTGRES_PASSWORD'),
      database: this.configService.get<string>('POSTGRES_DATABASE'),
      entities: [User, RefreshToken, OtpCode],
      migrations: [`${__dirname}/**/database/migrations/**/*{.ts,.js}`],
      synchronize: true,
    };
  }
}
