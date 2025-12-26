import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { TransitionReservationDto } from './dto/transition-reservation.dto';
import { ApiResponse } from '../common/dto/response.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

/**
 * Admin 전용 예약 관리 API
 */
@Controller('admin/reservations')
@UseGuards(AdminRoleGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * PATCH /admin/reservations/:id/status
   * 예약 상태 전이 (BOOKED → CANCELLED/COMPLETED)
   * 멱등성 보장: 이미 전이된 상태면 아무것도 하지 않음
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async transitionReservationStatus(
    @Param('id') id: string,
    @Body() dto: TransitionReservationDto,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    const result = await this.reservationsService.transitionReservationStatus(id, dto);
    return ApiResponse.success(result, '예약 상태가 변경되었습니다.');
  }
}
