import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationsRepository } from './invitations.repository';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { ValidateTokenResponseDto } from './dto/validate-token-response.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 초대 링크 토큰 생성
   * @param email 예약자 이메일
   * @param counselorId 상담사 ID (현재 로그인한 상담사)
   * @param expiresInDays 만료일 (기본값: 환경변수 또는 7일)
   */
  async createInvitation(email: string, counselorId: string, expiresInDays?: number): Promise<InvitationResponseDto> {
    // 이메일 정규화
    const normalizedEmail = email.toLowerCase().trim();

    // 만료일 계산 (기본값: 환경변수 또는 7일)
    const defaultExpiresInDays = this.configService.get<number>('INVITATION_TOKEN_EXPIRES_DAYS') || 7;
    const expiresIn = expiresInDays || defaultExpiresInDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // 토큰 생성 (기존 토큰이 있으면 재발급)
    const inviteToken = await this.invitationsRepository.createOrUpdateInviteToken(counselorId, expiresAt);

    // 프론트엔드 URL 가져오기 (환경변수 또는 기본값)
    const frontendUrl = this.configService.get<string>('APPLICANT_FRONTEND_URL') || 'http://localhost:5173';
    const link = `${frontendUrl}/reservation?token=${inviteToken.token}`;

    return {
      token: inviteToken.token,
      link,
      email: normalizedEmail,
      expiresAt: inviteToken.expiresAt,
      counselorId: inviteToken.counselorId,
    };
  }

  /**
   * 토큰 검증
   * @param token 검증할 토큰
   */
  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    if (!token) {
      throw new BadRequestException('토큰이 필요합니다.');
    }

    const inviteToken = await this.invitationsRepository.validateToken(token);

    if (!inviteToken) {
      throw new NotFoundException('유효하지 않거나 만료된 토큰입니다.');
    }

    // Repository에서 이미 counselor 정보를 include로 가져옴
    if (!inviteToken.counselor) {
      throw new NotFoundException('상담사 정보를 찾을 수 없습니다.');
    }

    return {
      email: inviteToken.counselor.email,
      counselorId: inviteToken.counselor.id,
      expiresAt: inviteToken.expiresAt,
    };
  }
}
