import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';
import { InvitationsService } from '../invitations/invitations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { Reservation } from '@prisma/client';
import { ValidateTokenResponseDto } from '../invitations/dto/validate-token-response.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * 예약 생성 (Public API)
   * 동시성 제어 + 정원 제한 + 중복 예약 방지
   */
  async createReservation(dto: CreateReservationDto): Promise<ReservationResponseDto> {
    // 1. Token 검증
    let tokenInfo: ValidateTokenResponseDto;
    try {
      tokenInfo = await this.invitationsService.validateToken(dto.token);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다.');
      }
      throw error;
    }

    const counselorId: string = tokenInfo.counselorId;

    // 2. 슬롯 조회 및 권한 확인
    const slot = await this.reservationsRepository.findSlotById(dto.slotId);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    // 3. token의 counselorId와 slot의 counselorId 일치 확인
    if (slot.counselorId !== counselorId) {
      throw new ForbiddenException('다른 상담사의 슬롯은 예약할 수 없습니다.');
    }

    // 4. Email 정규화
    const normalizedEmail: string = dto.email ? dto.email.toLowerCase().trim() : tokenInfo.email.toLowerCase().trim();

    // 5. 트랜잭션으로 예약 생성 (동시성 제어 포함)
    try {
      const reservation: Reservation = await this.reservationsRepository.createReservationWithLock({
        slotId: dto.slotId,
        email: normalizedEmail,
        name: dto.name,
        note: dto.note,
      });

      return this.toResponseDto(reservation);
    } catch (error) {
      // Repository에서 던진 에러 처리
      if (error instanceof Error) {
        switch (error.message) {
          case 'SLOT_NOT_FOUND':
            throw new NotFoundException('슬롯을 찾을 수 없습니다.');
          case 'SLOT_FULL':
            throw new BadRequestException('슬롯이 가득 찼습니다.');
          case 'DUPLICATE_RESERVATION':
            throw new ConflictException('이미 예약된 이메일입니다.');
          default:
            throw new BadRequestException('예약 생성에 실패했습니다.');
        }
      }
      throw error;
    }
  }

  /**
   * Reservation을 ReservationResponseDto로 변환
   */
  private toResponseDto(reservation: Reservation): ReservationResponseDto {
    return {
      id: reservation.id,
      slotId: reservation.slotId,
      email: reservation.email,
      name: reservation.name,
      note: reservation.note ?? undefined, // null을 undefined로 변환
      status: reservation.status,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      cancelledAt: reservation.cancelledAt ?? undefined, // null을 undefined로 변환
    };
  }
}
