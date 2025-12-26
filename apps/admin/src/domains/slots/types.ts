// Slot 관련 타입 정의

export interface Slot {
  id: string;
  counselorId: string;
  startAt: string; // ISO 8601 datetime string
  endAt: string; // ISO 8601 datetime string
  capacity: number;
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlotDto {
  startAt: string; // ISO 8601 datetime string
  endAt: string; // ISO 8601 datetime string
  capacity?: number; // 기본값 3
}

export interface UpdateSlotDto {
  startAt?: string;
  endAt?: string;
  capacity?: number;
}

// 캘린더 모드 타입
export type CalendarMode = 'viewReservations' | 'editSlots';
