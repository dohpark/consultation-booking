import { IsDateString, IsArray, IsString, IsInt, IsOptional, Min, Max, Matches, ArrayMinSize } from 'class-validator';

export class CreateBatchSlotsDto {
  @IsDateString({}, { message: '시작 날짜는 유효한 날짜 형식이어야 합니다.' })
  startDate: string; // YYYY-MM-DD

  @IsDateString({}, { message: '종료 날짜는 유효한 날짜 형식이어야 합니다.' })
  endDate: string; // YYYY-MM-DD

  @IsArray({ message: '시간대 목록은 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 시간대가 필요합니다.' })
  @IsString({ each: true, message: '각 시간대는 문자열이어야 합니다.' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    each: true,
    message: '시간대는 HH:MM 형식이어야 합니다. (예: 09:00, 14:30)',
  })
  timeSlots: string[]; // ["09:00", "10:00", "11:00", ...]

  @IsOptional()
  @IsInt({ message: '정원은 숫자여야 합니다.' })
  @Min(1, { message: '정원은 최소 1명 이상이어야 합니다.' })
  @Max(100, { message: '정원은 최대 100명까지 설정할 수 있습니다.' })
  capacity?: number; // 기본값 3

  @IsOptional()
  @IsArray({ message: '제외 날짜 목록은 배열이어야 합니다.' })
  @IsDateString({}, { each: true, message: '각 제외 날짜는 유효한 날짜 형식이어야 합니다.' })
  excludeDates?: string[]; // 제외할 날짜들 (YYYY-MM-DD)
}
