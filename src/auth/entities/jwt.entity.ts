import { BaseEntityWithIdAndDates } from 'src/shared';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity()
export class RefreshToken extends BaseEntityWithIdAndDates {
  @Column()
  token: string;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}