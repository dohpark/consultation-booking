export class SlotResponseDto {
  id: string;
  counselorId: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  bookedCount: number;
  availableCount: number; // capacity - bookedCount
  createdAt: Date;
  updatedAt: Date;
}
