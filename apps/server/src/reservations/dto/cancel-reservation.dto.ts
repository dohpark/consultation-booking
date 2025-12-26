import { IsString, IsNotEmpty } from 'class-validator';

export class CancelReservationDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '토큰은 필수입니다.' })
  token: string;
}
