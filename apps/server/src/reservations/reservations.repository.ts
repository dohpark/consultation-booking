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

  /**
   * 슬롯별 예약 목록 조회
   */
  async findBySlotId(slotId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { slotId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * 예약 상태 전이 (멱등성 보장)
   * BOOKED → CANCELLED/COMPLETED
   * 핵심 로직:
   * 1. WHERE status='BOOKED' 조건으로 멱등하게 처리
   * 2. UPDATE 결과가 0이면 아무것도 안 함 (이미 CANCELLED/COMPLETED)
   * 3. UPDATE 결과가 1이면 booked_count - 1 (방어적으로 AND booked_count > 0)
   * 4. CANCELLED인 경우 cancelledAt 기록
   */
  async transitionReservationStatus(
    reservationId: string,
    newStatus: 'CANCELLED' | 'COMPLETED',
  ): Promise<{ updated: boolean; reservation: Reservation | null }> {
    return this.prisma.$transaction(
      async tx => {
        // 1. 예약 조회 (slotId 확인용)
        const reservation = await tx.reservation.findUnique({
          where: { id: reservationId },
          select: {
            id: true,
            slotId: true,
            status: true,
          },
        });

        if (!reservation) {
          throw new Error('RESERVATION_NOT_FOUND'); // 404
        }

        // 2. 상태 전이 (WHERE status='BOOKED' 조건으로 멱등하게 처리)
        const updateData: {
          status: 'CANCELLED' | 'COMPLETED';
          cancelledAt?: Date;
        } = {
          status: newStatus,
        };

        // CANCELLED인 경우 cancelledAt 기록
        if (newStatus === 'CANCELLED') {
          updateData.cancelledAt = new Date();
        }

        const updateResult = await tx.reservation.updateMany({
          where: {
            id: reservationId,
            status: 'BOOKED', // 핵심: BOOKED 상태인 것만 업데이트 (멱등성)
          },
          data: updateData,
        });

        // 3. UPDATE 결과가 0이면 아무것도 안 함 (이미 CANCELLED/COMPLETED)
        if (updateResult.count === 0) {
          // 이미 전이된 상태이므로 현재 상태 조회해서 반환
          const currentReservation = await tx.reservation.findUnique({
            where: { id: reservationId },
          });
          return {
            updated: false,
            reservation: currentReservation,
          };
        }

        // 4. UPDATE 결과가 1이면 booked_count - 1 (방어적으로 AND booked_count > 0)
        await tx.$executeRaw`
          UPDATE slots
          SET booked_count = booked_count - 1
          WHERE id = ${reservation.slotId}
            AND booked_count > 0
        `;

        // 5. 업데이트된 예약 조회
        const updatedReservation = await tx.reservation.findUnique({
          where: { id: reservationId },
        });

        return {
          updated: true,
          reservation: updatedReservation,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * 상담자 내역 조회 (커서 기반 페이지네이션)
   * email 인덱스 활용하여 성능 최적화
   * hasNote 포함 (consultation_notes 조인)
   */
  async findClientHistory(params: {
    email: string;
    status?: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
    cursor?: string; // createdAt timestamp
    limit: number;
  }): Promise<{
    items: Array<
      Reservation & {
        slot: {
          startAt: Date;
          endAt: Date;
          counselor: {
            name: string;
          };
        };
        consultationNote: { id: string } | null;
      }
    >;
    hasMore: boolean;
  }> {
    const normalizedEmail = params.email.toLowerCase().trim();

    // 커서 파싱 (ISO 8601 또는 timestamp)
    let cursorDate: Date | undefined;
    if (params.cursor) {
      try {
        // ISO 8601 형식 시도
        cursorDate = new Date(params.cursor);
        if (isNaN(cursorDate.getTime())) {
          // timestamp 형식 시도
          cursorDate = new Date(parseInt(params.cursor, 10));
        }
        if (isNaN(cursorDate.getTime())) {
          cursorDate = undefined;
        }
      } catch {
        cursorDate = undefined;
      }
    }

    // WHERE 조건 구성
    const where: Prisma.ReservationWhereInput = {
      email: normalizedEmail,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (cursorDate) {
      where.createdAt = {
        lt: cursorDate, // 커서보다 이전 데이터만 조회 (내림차순이므로)
      };
    }

    // limit + 1로 조회하여 hasMore 판단
    const take = params.limit + 1;

    const reservations = await this.prisma.reservation.findMany({
      where,
      take,
      orderBy: {
        createdAt: 'desc', // 최신순
      },
      include: {
        slot: {
          include: {
            counselor: {
              select: {
                name: true,
              },
            },
          },
        },
        consultationNote: {
          select: {
            id: true,
          },
        },
      },
    });

    // hasMore 판단
    const hasMore = reservations.length > params.limit;
    const items = hasMore ? reservations.slice(0, params.limit) : reservations;

    return {
      items: items as Array<
        Reservation & {
          slot: {
            startAt: Date;
            endAt: Date;
            counselor: {
              name: string;
            };
          };
          consultationNote: { id: string } | null;
        }
      >,
      hasMore,
    };
  }
}
