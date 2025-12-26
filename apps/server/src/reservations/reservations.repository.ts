import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Reservation, Prisma } from '@prisma/client';

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 슬롯 조회 (ID)
   */
  async findSlotById(id: string) {
    return this.prisma.slot.findUnique({
      where: { id },
      select: {
        id: true,
        counselorId: true,
        capacity: true,
        bookedCount: true,
      },
    });
  }

  /**
   * 트랜잭션으로 좌석 확보 + 예약 생성
   * 핵심 로직: Raw SQL로 원자적 UPDATE (booked_count < capacity 조건)
   */
  async createReservationWithLock(data: {
    slotId: string;
    email: string;
    name: string;
    note?: string;
  }): Promise<Reservation> {
    return this.prisma.$transaction(
      async tx => {
        // 1. 좌석 확보 (원자적 UPDATE - Raw SQL 사용)
        // UPDATE slots SET booked_count = booked_count + 1
        // WHERE id = $1 AND booked_count < capacity
        const updateResult = await tx.$executeRaw`
          UPDATE slots
          SET booked_count = booked_count + 1
          WHERE id = ${data.slotId}
            AND booked_count < capacity
        `;

        // UPDATE 결과가 0이면 실패 (가득 참 또는 슬롯 없음)
        if (updateResult === 0) {
          // 슬롯 재조회해서 에러 구분
          const slot = await tx.slot.findUnique({
            where: { id: data.slotId },
            select: {
              id: true,
              capacity: true,
              bookedCount: true,
            },
          });

          if (!slot) {
            throw new Error('SLOT_NOT_FOUND'); // 404
          }

          if (slot.bookedCount >= slot.capacity) {
            throw new Error('SLOT_FULL'); // 400
          }

          // 그 외의 경우 (예상치 못한 에러)
          throw new Error('SLOT_UPDATE_FAILED');
        }

        // 2. 예약 생성
        try {
          const reservation = await tx.reservation.create({
            data: {
              slotId: data.slotId,
              email: data.email,
              name: data.name,
              note: data.note,
              status: 'BOOKED',
            },
          });

          return reservation;
        } catch (error) {
          // UNIQUE 충돌 (P2002: 이미 예약된 이메일)
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // target이 ['slotId', 'email']이면 중복 예약
            const target = error.meta?.target as string[] | undefined;
            if (target && target.includes('slotId') && target.includes('email')) {
              throw new Error('DUPLICATE_RESERVATION'); // 409
            }
          }
          throw error;
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // 최고 격리 수준
      },
    );
  }

  /**
   * 예약 조회 (ID)
   */
  async findById(id: string): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
    });
  }
}
