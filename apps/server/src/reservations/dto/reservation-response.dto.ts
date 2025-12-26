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
}
