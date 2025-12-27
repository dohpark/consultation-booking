import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Slot } from '@prisma/client';

@Injectable()
export class SlotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 단일 슬롯 생성
   */
  async create(data: { counselorId: string; startAt: Date; endAt: Date; capacity?: number }): Promise<Slot> {
    return this.prisma.slot.create({
      data: {
        counselorId: data.counselorId,
        startAt: data.startAt,
        endAt: data.endAt,
        capacity: data.capacity ?? 3,
        bookedCount: 0,
      },
    });
  }

  /**
   * 배치 슬롯 생성 (트랜잭션)
   */
  async createBatch(
    slots: Array<{
      counselorId: string;
      startAt: Date;
      endAt: Date;
      capacity?: number;
    }>,
  ): Promise<Slot[]> {
    return this.prisma.$transaction(
      slots.map(slot =>
        this.prisma.slot.create({
          data: {
            counselorId: slot.counselorId,
            startAt: slot.startAt,
            endAt: slot.endAt,
            capacity: slot.capacity ?? 3,
            bookedCount: 0,
          },
        }),
      ),
    );
  }

  /**
   * 슬롯 조회 (ID)
   */
  async findById(id: string): Promise<Slot | null> {
    return this.prisma.slot.findUnique({
      where: { id },
    });
  }

  /**
   * 상담사별 날짜 범위 조회
   */
  async findByCounselorAndDateRange(counselorId: string, from: Date, to: Date): Promise<Slot[]> {
    return this.prisma.slot.findMany({
      where: {
        counselorId,
        startAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  /**
   * 특정 날짜의 슬롯 조회 (상담사별, 예약 정보 포함)
   */
  async findByCounselorAndDate(
    counselorId: string,
    date: Date,
  ): Promise<Array<Slot & { reservations: Array<{ id: string }> }>> {
    // date는 이미 UTC 자정으로 전달됨
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prisma.slot.findMany({
      where: {
        counselorId,
        startAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      include: {
        reservations: {
          where: {
            status: 'BOOKED',
          },
          select: {
            id: true,
          },
        },
      },
    });
  }

  /**
   * 슬롯에 예약이 있는지 확인 (BOOKED 상태만)
   */
  async hasBookedReservations(id: string): Promise<boolean> {
    const count = await this.prisma.reservation.count({
      where: {
        slotId: id,
        status: 'BOOKED',
      },
    });
    return count > 0;
  }

  /**
   * 슬롯 삭제
   */
  async delete(id: string): Promise<Slot> {
    return this.prisma.slot.delete({
      where: { id },
    });
  }

  /**
   * 중복 슬롯 확인 (같은 상담사, 같은 시간대)
   */
  async findDuplicate(counselorId: string, startAt: Date, endAt: Date): Promise<Slot | null> {
    return this.prisma.slot.findFirst({
      where: {
        counselorId,
        startAt,
        endAt,
      },
    });
  }
}
