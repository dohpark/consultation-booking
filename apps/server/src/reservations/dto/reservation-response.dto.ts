export class ReservationResponseDto {
  id: string;
  slotId: string;
  email: string;
  name: string;
  note?: string;
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  reservationToken?: string; // 예약 취소용 토큰 (예약 생성 시에만 포함)
}
