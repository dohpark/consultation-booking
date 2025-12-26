import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateReservationDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '토큰은 필수입니다.' })
  token: string;

  @IsString({ message: '슬롯 ID는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '슬롯 ID는 필수입니다.' })
  slotId: string;

  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email?: string; // 선택사항, token에서 추출 가능

  @IsOptional()
  @IsString({ message: '메모는 문자열이어야 합니다.' })
  note?: string;
}
