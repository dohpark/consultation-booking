import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
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

  validate(payload: JwtPayload) {
    if (!payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
