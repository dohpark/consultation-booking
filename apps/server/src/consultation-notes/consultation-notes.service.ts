import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConsultationNotesRepository } from './consultation-notes.repository';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpsertConsultationNoteDto } from './dto/upsert-consultation-note.dto';
import { ConsultationNote } from '@prisma/client';

@Injectable()
export class ConsultationNotesService {
  constructor(
    private readonly consultationNotesRepository: ConsultationNotesRepository,
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  /**
   * 예약 ID로 상담 노트 조회 (Admin API)
   * - 예약 존재 확인 및 권한 검증 (해당 상담사의 슬롯인지)
   * - 노트가 없을 경우 null 반환 (404 아님)
   */
  async getNoteByReservationId(reservationId: string, counselorId: string): Promise<NoteResponseDto | null> {
    // 1. 예약 조회
    const reservation = await this.reservationsRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 2. 슬롯 조회 및 권한 확인
    const slot = await this.reservationsRepository.findSlotById(reservation.slotId);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    // 3. 권한 확인 (본인의 슬롯만 조회 가능)
    if (slot.counselorId !== counselorId) {
      throw new ForbiddenException('본인의 예약만 조회할 수 있습니다.');
    }

    // 4. 상담 노트 조회 (없으면 null 반환)
    const note = await this.consultationNotesRepository.findByReservationId(reservationId);

    if (!note) {
      return null;
    }

    return this.toResponseDto(note);
  }

  /**
   * 상담 노트 생성 또는 수정 (Upsert) (Admin API)
   * - 예약 존재 확인 및 권한 검증 (해당 상담사의 슬롯인지)
   * - 기존 노트가 있으면 수정, 없으면 생성
   */
  async upsertNote(
    reservationId: string,
    dto: UpsertConsultationNoteDto,
    counselorId: string,
  ): Promise<NoteResponseDto> {
    // 1. 예약 조회
    const reservation = await this.reservationsRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 2. 슬롯 조회 및 권한 확인
    const slot = await this.reservationsRepository.findSlotById(reservation.slotId);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    // 3. 권한 확인 (본인의 슬롯만 수정 가능)
    if (slot.counselorId !== counselorId) {
      throw new ForbiddenException('본인의 예약만 수정할 수 있습니다.');
    }

    // 4. Upsert (기존 노트가 있으면 수정, 없으면 생성)
    const note = await this.consultationNotesRepository.upsertNote({
      reservationId,
      slotId: reservation.slotId,
      content: dto.content,
    });

    return this.toResponseDto(note);
  }

  /**
   * ConsultationNote를 NoteResponseDto로 변환
   */
  private toResponseDto(note: ConsultationNote): NoteResponseDto {
    return {
      id: note.id,
      reservationId: note.reservationId,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
