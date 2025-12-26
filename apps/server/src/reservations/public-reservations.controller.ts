import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ApiResponse } from '../common/dto/response.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

/**
 * Public 예약 생성 API
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
  async createReservation(
    @Body() dto: CreateReservationDto,
  ): Promise<ApiResponse<ReservationResponseDto>> {
    const result = await this.reservationsService.createReservation(dto);
    return ApiResponse.success(result, '예약이 생성되었습니다.');
  }
}

