import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateSlotDto {
  @IsDateString({}, { message: '유효한 날짜 형식이 아닙니다.' })
  startAt: string; // ISO 8601 datetime string

  @IsDateString({}, { message: '유효한 날짜 형식이 아닙니다.' })
  endAt: string; // ISO 8601 datetime string

  @IsOptional()
  @IsInt({ message: '정원은 숫자여야 합니다.' })
  @Min(1, { message: '정원은 최소 1명 이상이어야 합니다.' })
  @Max(100, { message: '정원은 최대 100명까지 설정할 수 있습니다.' })
  capacity?: number; // 기본값 3
}
