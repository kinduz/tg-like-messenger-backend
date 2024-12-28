import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { RefreshToken } from 'src/auth/entities/jwt.entity';
import { OtpCode } from 'src/auth/entities/otp.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'qwerty',
  database: 'rocket-chat',
  entities: [User, RefreshToken, OtpCode],
  migrations: [`${__dirname}/**/database/migrations/**/*{.ts,.js}`],
  synchronize: true,
});
 