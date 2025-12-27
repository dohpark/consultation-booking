import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ApiResponse } from '../common/dto/response.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';

/**
 * Admin 전용 초대 링크 관리 API
 * POST /admin/invitations
 */
@Controller('admin/invitations')
@UseGuards(AdminRoleGuard)
export class AdminInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * POST /admin/invitations
   * Admin이 이메일로 초대 링크 전송
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ApiResponse<InvitationResponseDto>> {
    const result = await this.invitationsService.createInvitation(dto.email, user.userId, dto.expiresInDays);
    return ApiResponse.success(result, '이메일이 전송되었습니다.');
  }
}
