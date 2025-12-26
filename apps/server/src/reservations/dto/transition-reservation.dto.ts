import { IsEnum, IsNotEmpty } from 'class-validator';

export class TransitionReservationDto {
  @IsEnum(['CANCELLED', 'COMPLETED'], {
    message: '상태는 CANCELLED 또는 COMPLETED만 가능합니다.',
  })
  @IsNotEmpty({ message: '상태는 필수입니다.' })
  status: 'CANCELLED' | 'COMPLETED';
}
