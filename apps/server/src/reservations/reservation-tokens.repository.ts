import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationToken } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ReservationTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ReservationToken 생성 또는 업데이트 (upsert)
   * 같은 reservationId에 이미 있으면 갱신/재사용
   */
  async createOrUpdateReservationToken(reservationId: string, expiresAt: Date): Promise<ReservationToken> {
    // 토큰 생성 (32바이트 랜덤 문자열을 base64url로 인코딩)
    const tokenBytes = crypto.randomBytes(32);
    const token = tokenBytes.toString('base64url');

    // upsert: 있으면 갱신, 없으면 생성
    return this.prisma.reservationToken.upsert({
      where: {
        reservationId,
      },
      update: {
        token,
        expiresAt,
      },
      create: {
        reservationId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * ReservationToken 검증
   * - 토큰이 존재하고 만료되지 않았는지 확인
   * - reservation 정보 포함하여 반환
   */
  async validateToken(
    token: string,
  ): Promise<(ReservationToken & { reservation: { id: string; status: string } }) | null> {
    const now = new Date();

    const reservationToken = await this.prisma.reservationToken.findUnique({
      where: { token },
      include: {
        reservation: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // 토큰이 없으면 null 반환
    if (!reservationToken) {
      return null;
    }

    // 만료 확인
    if (reservationToken.expiresAt < now) {
      return null;
    }

    return reservationToken;
  }

  /**
   * ReservationToken 조회 (reservationId로)
   */
  async findByReservationId(reservationId: string): Promise<ReservationToken | null> {
    return this.prisma.reservationToken.findUnique({
      where: { reservationId },
    });
  }
}
