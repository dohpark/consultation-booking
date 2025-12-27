import { ReservationStatus } from '@prisma/client';

export class ClientHistoryItemDto {
  id: string;
  slotId: string;
  email: string;
  name: string;
  status: ReservationStatus;
  slot: {
    startAt: Date;
    endAt: Date;
    counselor: {
      name: string;
    };
  };
  hasNote: boolean;
  createdAt: Date;
}

export class ClientHistoryResponseDto {
  items: ClientHistoryItemDto[];
  nextCursor?: string;
  hasMore: boolean;
}
