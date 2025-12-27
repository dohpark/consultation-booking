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
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { TransitionReservationDto } from './dto/transition-reservation.dto';
import { GetClientHistoryDto } from './dto/get-client-history.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { ClientHistoryResponseDto, ClientHistoryItemDto } from './dto/client-history-response.dto';
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
   * 예약 취소 (Public API)
   * token 기반으로 "내 예약 취소" 제공
   * - token이 유효하고, reservation의 email과 일치해야만 취소 가능
   * - 취소 성공 시 슬롯 잔여 인원 회복 (DEV-54 로직 사용)
   */
  async cancelReservation(reservationId: string, dto: CancelReservationDto): Promise<ReservationResponseDto> {
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

    // 2. 예약 조회
    const reservation = await this.reservationsRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 3. token의 email과 reservation의 email 일치 확인
    const tokenEmail: string = tokenInfo.email.toLowerCase().trim();
    const reservationEmail: string = reservation.email.toLowerCase().trim();

    if (tokenEmail !== reservationEmail) {
      throw new ForbiddenException('본인의 예약만 취소할 수 있습니다.');
    }

    // 4. 상태 전이 (DEV-54 로직 재사용)
    try {
      const result = await this.reservationsRepository.transitionReservationStatus(reservationId, 'CANCELLED');

      if (!result.reservation) {
        throw new NotFoundException('예약을 찾을 수 없습니다.');
      }

      return this.toResponseDto(result.reservation);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        switch (error.message) {
          case 'RESERVATION_NOT_FOUND':
            throw new NotFoundException('예약을 찾을 수 없습니다.');
          default:
            throw new BadRequestException('예약 취소에 실패했습니다.');
        }
      }
      throw error;
    }
  }

  /**
   * 예약 상태 전이 (멱등성 보장)
   * BOOKED → CANCELLED/COMPLETED
   * - WHERE status='BOOKED' 조건으로 멱등하게 처리
   * - UPDATE 결과가 0이면 아무것도 안 함 (이미 전이됨)
   * - UPDATE 결과가 1이면 booked_count - 1
   */
  async transitionReservationStatus(
    reservationId: string,
    dto: TransitionReservationDto,
  ): Promise<ReservationResponseDto> {
    try {
      const result = await this.reservationsRepository.transitionReservationStatus(reservationId, dto.status);

      if (!result.reservation) {
        throw new NotFoundException('예약을 찾을 수 없습니다.');
      }

      return this.toResponseDto(result.reservation);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        switch (error.message) {
          case 'RESERVATION_NOT_FOUND':
            throw new NotFoundException('예약을 찾을 수 없습니다.');
          default:
            throw new BadRequestException('예약 상태 전이에 실패했습니다.');
        }
      }
      throw error;
    }
  }

  /**
   * 슬롯별 예약 목록 조회 (Admin API)
   * - 슬롯의 counselorId와 현재 사용자의 userId 일치 확인
   */
  async getReservationsBySlotId(slotId: string, counselorId: string): Promise<ReservationResponseDto[]> {
    // 1. 슬롯 조회 및 권한 확인
    const slot = await this.reservationsRepository.findSlotById(slotId);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    // 2. 권한 확인 (본인의 슬롯만 조회 가능)
    if (slot.counselorId !== counselorId) {
      throw new ForbiddenException('본인의 슬롯만 조회할 수 있습니다.');
    }

    // 3. 예약 목록 조회
    const reservations = await this.reservationsRepository.findBySlotId(slotId);

    return reservations.map(reservation => this.toResponseDto(reservation));
  }

  /**
   * 상담자 내역 조회 (Admin API)
   * - email 인덱스 활용하여 성능 최적화
   * - 커서 기반 페이지네이션
   * - hasNote 포함
   */
  async getClientHistory(dto: GetClientHistoryDto): Promise<ClientHistoryResponseDto> {
    // limit을 number로 변환 (Query 파라미터는 문자열로 옴)
    const limit = dto.limit ? Number(dto.limit) : 20;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('페이지 크기는 1 이상 50 이하여야 합니다.');
    }

    const result = await this.reservationsRepository.findClientHistory({
      email: dto.email,
      status: dto.status,
      cursor: dto.cursor,
      limit,
    });

    // DTO 변환
    const items: ClientHistoryItemDto[] = result.items.map(item => ({
      id: item.id,
      slotId: item.slotId,
      email: item.email,
      name: item.name,
      status: item.status,
      slot: {
        startAt: item.slot.startAt,
        endAt: item.slot.endAt,
        counselor: {
          name: item.slot.counselor.name,
        },
      },
      hasNote: item.consultationNote !== null,
      createdAt: item.createdAt,
    }));

    // nextCursor 계산 (마지막 항목의 createdAt)
    let nextCursor: string | undefined;
    if (result.hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = lastItem.createdAt.toISOString();
    }

    return {
      items,
      nextCursor,
      hasMore: result.hasMore,
    };
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
