import type { Reservation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 슬롯별 예약 목록 조회
 */
export async function fetchReservationsBySlotId(slotId: string): Promise<Reservation[]> {
  const url = getApiEndpoint(`/admin/slots/${slotId}/reservations`);

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '예약 조회에 실패했습니다.' }));
    throw new Error(error.message || '예약 조회에 실패했습니다.');
  }

  const data: ApiResponse<Reservation[]> = await response.json();
  return data.success && data.data ? data.data : [];
}

/**
 * 여러 슬롯의 예약을 병렬로 조회
 */
export async function fetchReservationsBySlotIds(slotIds: string[]): Promise<Reservation[]> {
  if (slotIds.length === 0) {
    return [];
  }

  // 모든 슬롯의 예약을 병렬로 조회
  const promises = slotIds.map(slotId => fetchReservationsBySlotId(slotId));
  const results = await Promise.allSettled(promises);

  // 성공한 결과만 합치기
  const allReservations: Reservation[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allReservations.push(...result.value);
    }
  });

  return allReservations;
}

