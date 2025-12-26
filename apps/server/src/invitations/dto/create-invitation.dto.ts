import { IsEmail, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email: string;

  @IsOptional()
  @IsInt({ message: '만료일은 숫자여야 합니다.' })
  @Min(1, { message: '만료일은 최소 1일 이상이어야 합니다.' })
  @Max(365, { message: '만료일은 최대 365일까지 설정할 수 있습니다.' })
  expiresInDays?: number; // 기본값: 7일 또는 30일 (환경변수)
}
