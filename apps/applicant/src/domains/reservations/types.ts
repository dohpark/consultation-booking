// Reservation 관련 타입 정의

export interface Reservation {
  id: string;
  slotId: string;
  email: string;
  name: string;
  note?: string;
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  reservationToken?: string;
}

export interface CreateReservationDto {
  token: string;
  slotId: string;
  name: string;
  email?: string;
  note?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

