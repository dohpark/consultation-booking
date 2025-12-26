import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { CurrentUser } from '../decorators/current-user.decorator';

/**
 * AdminRoleGuard
 *
 * Admin 전용 API를 보호하는 Guard입니다.
 * - JWT 인증이 필요합니다 (JwtAuthGuard를 상속)
 * - 현재는 Google OAuth로 로그인한 사용자는 모두 Admin으로 간주합니다.
 * - 향후 Applicant token 기반 인증이 추가되면, role 필드를 확인하도록 확장 가능합니다.
 */
@Injectable()
export class AdminRoleGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT 인증 먼저 확인
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const user = request.user;

    // JWT가 있으면 Admin으로 간주 (Google OAuth 사용자는 모두 Admin)
    // 향후 role 필드가 추가되면 아래와 같이 확인:
    // if (user.role !== 'admin') {
    //   throw new ForbiddenException('Admin access required');
    // }
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    return true;
  }
}
