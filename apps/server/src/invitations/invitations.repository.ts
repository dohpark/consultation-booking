import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteToken } from '@prisma/client';
import { randomBytes } from 'crypto';

type InviteTokenWithCounselor = {
  id: string;
  counselorId: string;
  token: string;
  clientEmail: string;
  expiresAt: Date;
  createdAt: Date;
  counselor: {
    id: string;
    email: string;
  };
};

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 토큰 생성 (기존 토큰이 있으면 재발급)
   * 같은 상담자 + 같은 이메일 조합의 토큰만 재발급
   */
  async createOrUpdateInviteToken(counselorId: string, clientEmail: string, expiresAt: Date): Promise<InviteToken> {
    // 기존 토큰이 있으면 삭제 후 새로 생성 (재발급)
    // 같은 상담자 + 같은 이메일 조합의 토큰만 삭제 (다른 이메일의 토큰은 유지)
    const normalizedEmail = clientEmail.toLowerCase().trim();
    await this.prisma.inviteToken.deleteMany({
      where: {
        counselorId,
        clientEmail: normalizedEmail,
      },
    });

    // 랜덤 토큰 생성 (32바이트 = 64자리 hex 문자열)
    const token = randomBytes(32).toString('hex');

    return this.prisma.inviteToken.create({
      data: {
        counselorId,
        token,
        clientEmail: clientEmail.toLowerCase().trim(),
        expiresAt,
      } as Parameters<typeof this.prisma.inviteToken.create>[0]['data'],
    });
  }

  /**
   * 토큰으로 조회 및 검증
   */
  async validateToken(token: string): Promise<InviteTokenWithCounselor | null> {
    const inviteToken = (await this.prisma.inviteToken.findUnique({
      where: { token },
      include: {
        counselor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })) as InviteTokenWithCounselor | null;

    if (!inviteToken) {
      return null;
    }

    // 만료 확인
    if (inviteToken.expiresAt < new Date()) {
      return null;
    }

    return inviteToken;
  }

  /**
   * 상담사 ID로 기존 토큰 조회
   */
  async findByCounselorId(counselorId: string): Promise<InviteToken | null> {
    return this.prisma.inviteToken.findFirst({
      where: {
        counselorId,
        expiresAt: {
          gt: new Date(), // 만료되지 않은 토큰만
        },
      },
    });
  }
}
