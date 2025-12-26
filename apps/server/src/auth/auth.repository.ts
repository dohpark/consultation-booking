import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Google OAuth sub로 상담사 조회
   */
  async findByGoogleSub(googleSub: string) {
    return this.prisma.counselor.findUnique({
      where: { googleSub },
    });
  }

  /**
   * 이메일로 상담사 조회
   */
  async findByEmail(email: string) {
    return this.prisma.counselor.findUnique({
      where: { email },
    });
  }

  /**
   * 상담사 생성 또는 업데이트 (upsert)
   * Google OAuth 로그인 시 자동으로 상담사로 등록
   */
  async upsertByGoogleSub(data: { email: string; name: string; googleSub: string }) {
    return this.prisma.counselor.upsert({
      where: { googleSub: data.googleSub },
      update: {
        email: data.email,
        name: data.name,
      },
      create: {
        email: data.email,
        name: data.name,
        googleSub: data.googleSub,
      },
    });
  }
}
