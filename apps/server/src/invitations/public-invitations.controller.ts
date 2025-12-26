import { Controller, Get, Query } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { ApiResponse } from '../common/dto/response.dto';
import { ValidateTokenResponseDto } from './dto/validate-token-response.dto';

/**
 * Public 토큰 검증 API
 * GET /public/invitations/validate?token=...
 */
@Controller('public/invitations')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * GET /public/invitations/validate?token=...
   * 토큰 검증 (Public 엔드포인트)
   */
  @Get('validate')
  async validateToken(@Query('token') token: string): Promise<ApiResponse<ValidateTokenResponseDto>> {
    const result = await this.invitationsService.validateToken(token);
    return ApiResponse.success(result, '토큰이 유효합니다.');
  }
}
