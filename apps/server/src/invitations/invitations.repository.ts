import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteToken, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

type InviteTokenWithCounselor = Prisma.InviteTokenGetPayload<{
  include: {
    counselor: {
      select: {
        id: true;
        email: true;
      };
    };
  };
}>;

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 토큰 생성 (기존 토큰이 있으면 재발급)
   */
  async createOrUpdateInviteToken(counselorId: string, expiresAt: Date): Promise<InviteToken> {
    // 기존 토큰이 있으면 삭제 후 새로 생성 (재발급)
    await this.prisma.inviteToken.deleteMany({
      where: { counselorId },
    });

    // 랜덤 토큰 생성 (32바이트 = 64자리 hex 문자열)
    const token = randomBytes(32).toString('hex');

    return this.prisma.inviteToken.create({
      data: {
        counselorId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * 토큰으로 조회 및 검증
   */
  async validateToken(token: string): Promise<InviteTokenWithCounselor | null> {
    const inviteToken = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: {
        counselor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

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
