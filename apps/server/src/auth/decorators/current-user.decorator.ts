import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): CurrentUser => {
  const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();
  return request.user;
});
