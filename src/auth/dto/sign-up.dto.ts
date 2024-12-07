import { PickType } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class SignUpDto extends PickType(User, [
  'username',
  'avatar',
  'email',
  'password',
]) {}
