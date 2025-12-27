import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthRepository } from '../auth.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private authRepository: AuthRepository,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Authorization 헤더에서 Bearer 토큰 추출
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. 쿠키에서 access_token 추출
        (request: Request): string | null => {
          const cookies = (request as { cookies?: { access_token?: string } })?.cookies;
          const token = cookies?.access_token;
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      if (!payload.email || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Google sub로 Counselor 조회
      let counselor = await this.prisma.counselor.findUnique({
        where: { googleSub: payload.sub },
      });

      // Counselor가 없으면 자동 생성
      if (!counselor) {
        counselor = await this.authRepository.upsertByGoogleSub({
          email: payload.email,
          name: payload.name,
          googleSub: payload.sub,
        });
      }

      return {
        userId: counselor.id, // 실제 Counselor.id (UUID) 사용
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
