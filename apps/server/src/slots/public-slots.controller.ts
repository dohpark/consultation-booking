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
   * GET /public/slots?date=YYYY-MM-DD&token=...
   * 특정 날짜 슬롯 목록 조회 (예약 가능 여부 포함)
   */
  @Get()
  async getSlotsByDate(
    @Query('date') date: string,
    @Query('token') token: string,
    @Query('offset') offset?: string,
  ): Promise<ApiResponse<SlotResponseDto[]>> {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const tokenInfo = await this.invitationsService.validateToken(token);
    const counselorId: string = tokenInfo.counselorId;

    // 오프셋을 고려하여 서비스 호출 (기본값 0)
    const tzOffset = offset ? parseInt(offset, 10) : 0;
    const result: SlotResponseDto[] = await this.slotsService.getPublicSlotsByDate(counselorId, date, tzOffset);

    return ApiResponse.success(result);
  }
}
