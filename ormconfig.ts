import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { RefreshToken } from 'src/auth/entities/jwt.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'kinduz',
  password: 'qwerty',
  database: 'rocket-chat',
  entities: [User, RefreshToken],
  migrations: [`${__dirname}/**/database/migrations/**/*{.ts,.js}`],
  synchronize: true,
});
 