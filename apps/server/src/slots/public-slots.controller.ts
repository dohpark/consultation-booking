import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { ApiResponse } from '../common/dto/response.dto';
import { SlotResponseDto } from './dto/slot-response.dto';
import { InvitationsService } from '../invitations/invitations.service';

/**
 * Public 슬롯 조회 API
 */
@Controller('public/slots')
export class PublicSlotsController {
  constructor(
    private readonly slotsService: SlotsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * GET /public/slots?date=YYYY-MM-DD&token=...&offset=...
   * 또는
   * GET /public/slots?from=YYYY-MM-DD&to=YYYY-MM-DD&token=...&offset=...
   * 특정 날짜 또는 날짜 범위 슬롯 목록 조회 (예약 가능 여부 포함)
   */
  @Get()
  async getSlots(
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('token') token?: string,
    @Query('offset') offset?: string,
  ): Promise<ApiResponse<SlotResponseDto[]>> {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const tokenInfo = await this.invitationsService.validateToken(token);
    const counselorId: string = tokenInfo.counselorId;
    const tzOffset = offset ? parseInt(offset, 10) : 0;

    // 날짜 범위 조회 (from, to가 모두 있는 경우)
    if (from && to) {
      const result: SlotResponseDto[] = await this.slotsService.getPublicSlotsByDateRange(
        counselorId,
        from,
        to,
        tzOffset,
      );
      return ApiResponse.success(result);
    }

    // 단일 날짜 조회 (date가 있는 경우)
    if (date) {
      const result: SlotResponseDto[] = await this.slotsService.getPublicSlotsByDate(counselorId, date, tzOffset);
      return ApiResponse.success(result);
    }

    throw new BadRequestException('date 또는 from/to 파라미터가 필요합니다.');
  }
}
