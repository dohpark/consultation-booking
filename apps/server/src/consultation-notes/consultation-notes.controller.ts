import { Controller, Get, Put, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ConsultationNotesService } from './consultation-notes.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { ApiResponse } from '../common/dto/response.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpsertConsultationNoteDto } from './dto/upsert-consultation-note.dto';

/**
 * 상담 노트 관리 API
 */
@Controller('admin/reservations')
@UseGuards(AdminRoleGuard)
export class ConsultationNotesController {
  constructor(private readonly consultationNotesService: ConsultationNotesService) {}

  /**
   * GET /api/admin/reservations/:id/note
   * 상담 노트 조회
   * - 예약 존재 확인 및 권한 검증 (해당 상담사의 슬롯인지)
   * - 노트가 없을 경우 null 반환 (404 아님)
   */
  @Get(':id/note')
  async getNoteByReservationId(
    @Param('id') reservationId: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ApiResponse<NoteResponseDto | null>> {
    const result = await this.consultationNotesService.getNoteByReservationId(reservationId, user.userId);
    return ApiResponse.success(result);
  }

  /**
   * PUT /api/admin/reservations/:id/note
   * 상담 노트 생성 또는 수정 (Upsert)
   * - 예약 존재 확인 및 권한 검증 (해당 상담사의 슬롯인지)
   * - 기존 노트가 있으면 수정, 없으면 생성
   */
  @Put(':id/note')
  @HttpCode(HttpStatus.OK)
  async upsertNote(
    @Param('id') reservationId: string,
    @Body() dto: UpsertConsultationNoteDto,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ApiResponse<NoteResponseDto>> {
    const result = await this.consultationNotesService.upsertNote(reservationId, dto, user.userId);
    return ApiResponse.success(result, '저장되었습니다.');
  }
}
