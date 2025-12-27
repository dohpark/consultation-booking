import { Controller, Post, Body, Param, HttpCode, HttpStatus, Query, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ApiResponse } from '../common/dto/response.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

/**
 * Public 예약 관리 API
 */
@Controller('public/reservations')
export class PublicReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * POST /api/public/reservations
   * 예약 생성 (token 기반)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReservation(@Body() dto: CreateReservationDto): Promise<ApiResponse<ReservationResponseDto>> {
    const result = await this.reservationsService.createReservation(dto);
    return ApiResponse.success(result, '예약이 생성되었습니다.');
  }

  /**
   * POST /api/public/reservations/:id/cancel
   * 예약 취소 (InviteToken 기반)
   * - token이 유효하고, reservation의 email과 일치해야만 취소 가능
   * - 취소 성공 시 슬롯 잔여 인원 회복
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelReservation(
    @Param('id') id: string,
    @Body() dto: CancelReservationDto,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    const result = await this.reservationsService.cancelReservation(id, dto);
    return ApiResponse.success(result, '예약이 취소되었습니다.');
  }

  /**
   * POST /api/public/reservations/cancel?token=...
   * 예약 취소 (ReservationToken 기반)
   * - ReservationToken으로 예약을 찾고 취소
   * - 토큰이 유효하고 만료되지 않았는지 확인
   * - 중복 취소 호출해도 멱등하게 동작
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelReservationByToken(@Query('token') token: string): Promise<ApiResponse<ReservationResponseDto>> {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }
    const result = await this.reservationsService.cancelReservationByToken(token);
    return ApiResponse.success(result, '예약이 취소되었습니다.');
  }
}
