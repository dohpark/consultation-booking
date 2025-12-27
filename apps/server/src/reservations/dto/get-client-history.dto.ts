import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class GetClientHistoryDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsOptional()
  @IsEnum(['BOOKED', 'CANCELLED', 'COMPLETED'], {
    message: '상태는 BOOKED, CANCELLED, COMPLETED 중 하나여야 합니다.',
  })
  status?: ReservationStatus;

  @IsOptional()
  cursor?: string; // createdAt timestamp를 문자열로 전달 (ISO 8601 또는 timestamp)

  @IsOptional()
  limit?: string | number; // Query 파라미터는 문자열로 옴, Service에서 number로 변환
}
