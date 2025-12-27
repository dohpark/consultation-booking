import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultationNote } from '@prisma/client';

@Injectable()
export class ConsultationNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 예약 ID로 상담 노트 조회
   */
  async findByReservationId(reservationId: string): Promise<ConsultationNote | null> {
    return this.prisma.consultationNote.findUnique({
      where: { reservationId },
    });
  }

  /**
   * 상담 노트 생성 또는 수정 (Upsert)
   * 기존 노트가 있으면 수정, 없으면 생성
   */
  async upsertNote(data: { reservationId: string; slotId: string; content: string }): Promise<ConsultationNote> {
    return this.prisma.consultationNote.upsert({
      where: { reservationId: data.reservationId },
      update: {
        content: data.content,
        updatedAt: new Date(),
      },
      create: {
        reservationId: data.reservationId,
        slotId: data.slotId,
        content: data.content,
      },
    });
  }
}
