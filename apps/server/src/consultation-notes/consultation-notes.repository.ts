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
}
