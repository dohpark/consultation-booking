import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ConsultationNotesService } from './consultation-notes.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { ApiResponse } from '../common/dto/response.dto';
import { NoteResponseDto } from './dto/note-response.dto';

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
}
