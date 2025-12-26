import { Controller, Post, Delete, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import {
  CurrentUser as CurrentUserDecorator,
  CurrentUser as CurrentUserType,
} from '../auth/decorators/current-user.decorator';
import { CreateSlotDto } from './dto/create-slot.dto';
import { CreateBatchSlotsDto } from './dto/create-batch-slots.dto';
import { ApiResponse } from '../common/dto/response.dto';
import { SlotResponseDto } from './dto/slot-response.dto';

/**
 * Admin 전용 슬롯 관리 API
 */
@Controller('admin/slots')
@UseGuards(AdminRoleGuard)
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  /**
   * POST /admin/slots
   * 단일 슬롯 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSlot(
    @Body() dto: CreateSlotDto,
    @CurrentUserDecorator() user: CurrentUserType,
  ): Promise<ApiResponse<SlotResponseDto>> {
    const result = await this.slotsService.createSlot(user.userId, dto);
    return ApiResponse.success(result, '슬롯이 생성되었습니다.');
  }

  /**
   * POST /admin/slots/batch
   * 배치 슬롯 생성
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createBatchSlots(
    @Body() dto: CreateBatchSlotsDto,
    @CurrentUserDecorator() user: CurrentUserType,
  ): Promise<ApiResponse<SlotResponseDto[]>> {
    const result = await this.slotsService.createBatchSlots(user.userId, dto);
    return ApiResponse.success(result, `${result.length}개의 슬롯이 생성되었습니다.`);
  }

  /**
   * GET /admin/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
   * 날짜 범위 조회
   */
  @Get()
  async getSlotsByDateRange(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUserDecorator() user: CurrentUserType,
  ): Promise<ApiResponse<SlotResponseDto[]>> {
    const result = await this.slotsService.getSlotsByDateRange(user.userId, from, to);
    return ApiResponse.success(result);
  }

  /**
   * GET /admin/slots/:id
   * 슬롯 조회 (ID)
   */
  @Get(':id')
  async getSlotById(@Param('id') id: string): Promise<ApiResponse<SlotResponseDto>> {
    const result = await this.slotsService.getSlotById(id);
    return ApiResponse.success(result);
  }

  /**
   * DELETE /admin/slots/:id
   * 슬롯 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSlot(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUserType): Promise<ApiResponse<null>> {
    await this.slotsService.deleteSlot(id, user.userId);
    return ApiResponse.success(null, '슬롯이 삭제되었습니다.');
  }
}
