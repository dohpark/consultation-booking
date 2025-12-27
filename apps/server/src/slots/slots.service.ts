import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SlotsRepository } from './slots.repository';
import { CreateSlotDto } from './dto/create-slot.dto';
import { CreateBatchSlotsDto } from './dto/create-batch-slots.dto';
import { SlotResponseDto } from './dto/slot-response.dto';
import { Slot } from '@prisma/client';

@Injectable()
export class SlotsService {
  constructor(private readonly slotsRepository: SlotsRepository) {}

  /**
   * 단일 슬롯 생성
   */
  async createSlot(counselorId: string, dto: CreateSlotDto): Promise<SlotResponseDto> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    // 30분 단위 검증
    const duration = endAt.getTime() - startAt.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    if (duration !== thirtyMinutes) {
      throw new BadRequestException('슬롯은 정확히 30분 단위여야 합니다.');
    }

    // 중복 확인
    const duplicate = await this.slotsRepository.findDuplicate(counselorId, startAt, endAt);
    if (duplicate) {
      throw new ConflictException('이미 존재하는 슬롯입니다.');
    }

    const slot = await this.slotsRepository.create({
      counselorId,
      startAt,
      endAt,
      capacity: dto.capacity,
    });

    return this.toResponseDto(slot);
  }

  /**
   * 배치 슬롯 생성
   */
  async createBatchSlots(counselorId: string, dto: CreateBatchSlotsDto): Promise<SlotResponseDto[]> {
    // 날짜 문자열(YYYY-MM-DD)을 UTC 자정으로 파싱
    const parseUTCDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    };

    const startDate = parseUTCDate(dto.startDate);
    const endDate = parseUTCDate(dto.endDate);

    // 날짜 범위 검증
    if (startDate > endDate) {
      throw new BadRequestException('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    }

    // 제외 날짜 Set 생성 (YYYY-MM-DD 형식으로 저장)
    const excludeDatesSet = new Set(dto.excludeDates || []);

    // 생성할 슬롯 목록
    const slotsToCreate: Array<{
      counselorId: string;
      startAt: Date;
      endAt: Date;
      capacity?: number;
    }> = [];

    // 날짜 범위 순회
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      // 제외 날짜가 아니면 처리
      if (!excludeDatesSet.has(dateKey)) {
        // 각 시간대마다 슬롯 생성
        for (const timeSlot of dto.timeSlots) {
          const [hours, minutes] = timeSlot.split(':').map(Number);

          const startAt = new Date(currentDate);
          startAt.setUTCHours(hours, minutes, 0, 0);

          const endAt = new Date(startAt);
          endAt.setUTCMinutes(endAt.getUTCMinutes() + 30);

          // 중복 확인
          const duplicate = await this.slotsRepository.findDuplicate(counselorId, startAt, endAt);

          // 중복이 아니면 추가
          if (!duplicate) {
            slotsToCreate.push({
              counselorId,
              startAt,
              endAt,
              capacity: dto.capacity,
            });
          }
        }
      }

      // 다음 날로 이동 (UTC 기준)
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    if (slotsToCreate.length === 0) {
      throw new BadRequestException('생성할 슬롯이 없습니다. (모두 중복이거나 제외된 날짜)');
    }

    // 배치 생성 (트랜잭션)
    const createdSlots = await this.slotsRepository.createBatch(slotsToCreate);

    return createdSlots.map(slot => this.toResponseDto(slot));
  }

  /**
   * 슬롯 조회 (ID)
   */
  async getSlotById(id: string): Promise<SlotResponseDto> {
    const slot = await this.slotsRepository.findById(id);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }
    return this.toResponseDto(slot);
  }

  /**
   * 상담사별 날짜 범위 조회
   */
  async getSlotsByDateRange(counselorId: string, from: string, to: string): Promise<SlotResponseDto[]> {
    const parseUTCDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    };

    const fromDate = parseUTCDate(from);
    const toDate = parseUTCDate(to);
    // 종료 날짜의 끝(23:59:59.999 UTC)까지 포함하도록 설정
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    if (fromDate > toDateEnd) {
      throw new BadRequestException('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    }

    const slots = await this.slotsRepository.findByCounselorAndDateRange(counselorId, fromDate, toDateEnd);

    return slots.map(slot => this.toResponseDto(slot));
  }

  /**
   * 날짜 범위 슬롯 조회 (Public - 예약 가능 여부 포함)
   */
  async getPublicSlotsByDateRange(
    counselorId: string,
    from: string,
    to: string,
    offset: number = 0,
  ): Promise<SlotResponseDto[]> {
    const parseUTCDateWithOffset = (dateStr: string, offset: number) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      return new Date(targetDate.getTime() + offset * 60 * 1000);
    };

    const fromDate = parseUTCDateWithOffset(from, offset);
    const toDate = parseUTCDateWithOffset(to, offset);
    // 종료 날짜의 끝(23:59:59.999 UTC)까지 포함하도록 설정
    const toDateEnd = new Date(toDate);
    toDateEnd.setUTCHours(23, 59, 59, 999);

    if (fromDate > toDateEnd) {
      throw new BadRequestException('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    }

    const slots = await this.slotsRepository.findByCounselorAndDateRange(counselorId, fromDate, toDateEnd);

    return slots.map(slot => this.toResponseDto(slot));
  }

  /**
   * 특정 날짜의 슬롯 조회 (Public - 예약 가능 여부 포함)
   */
  async getPublicSlotsByDate(counselorId: string, date: string, offset: number = 0): Promise<SlotResponseDto[]> {
    const [year, month, day] = date.split('-').map(Number);
    // 1. UTC 기준 자정 객체 생성
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // 2. 사용자의 로컬 00:00:00에 해당하는 정확한 UTC 시점 계산
    // getTimezoneOffset()은 (UTC - 로컬) 분을 반환함.
    // 예: KST(UTC+9)는 -540분.
    // 29일 00:00 KST = 29일 00:00 UTC + (-540분) = 28일 15:00 UTC.
    const startOfLocalDayUtc = new Date(targetDate.getTime() + offset * 60 * 1000);

    const slots = await this.slotsRepository.findByCounselorAndDate(counselorId, startOfLocalDayUtc);

    return slots.map(slot => this.toResponseDto(slot));
  }

  /**
   * 슬롯 삭제
   */
  async deleteSlot(id: string, counselorId: string): Promise<void> {
    const slot = await this.slotsRepository.findById(id);
    if (!slot) {
      throw new NotFoundException('슬롯을 찾을 수 없습니다.');
    }

    // 권한 확인 (본인의 슬롯만 삭제 가능)
    if (slot.counselorId !== counselorId) {
      throw new BadRequestException('본인의 슬롯만 삭제할 수 있습니다.');
    }

    // 예약이 있는 슬롯은 삭제 불가
    const hasReservations = await this.slotsRepository.hasBookedReservations(id);
    if (hasReservations) {
      throw new BadRequestException('예약이 있는 슬롯은 삭제할 수 없습니다.');
    }

    await this.slotsRepository.delete(id);
  }

  /**
   * Slot을 SlotResponseDto로 변환
   */
  private toResponseDto(slot: Slot | (Slot & { reservations?: Array<{ id: string }> })): SlotResponseDto {
    // reservations가 포함된 경우 실제 예약 수를 카운트
    const bookedCount = 'reservations' in slot && slot.reservations ? slot.reservations.length : slot.bookedCount;

    return {
      id: slot.id,
      counselorId: slot.counselorId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      capacity: slot.capacity,
      bookedCount,
      availableCount: slot.capacity - bookedCount,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }
}
