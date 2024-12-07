import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BaseEntityWithIdAndDates } from '../entities';
import { User } from '../../users/entities/user.entity';

export const AuthUserId = createParamDecorator(
  (
    decoratorParam: never,
    ctx: ExecutionContext,
  ): BaseEntityWithIdAndDates['id'] => {
    return ctx.switchToHttp().getRequest().user.id;
  },
);

export const AuthUser = createParamDecorator(
  (decoratorParam: never, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest().user,
);
