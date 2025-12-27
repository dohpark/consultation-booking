import type { Reservation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ClientHistoryItem {
  id: string;
  slotId: string;
  email: string;
  name: string;
  status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
  slot: {
    startAt: string;
    endAt: string;
    counselor: {
      name: string;
    };
  };
  hasNote: boolean;
  createdAt: string;
}

export interface ClientHistoryResponse {
  items: ClientHistoryItem[];
  nextCursor?: string;
  hasMore: boolean;
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

/**
 * 클라이언트 상담 내역 조회 (커서 기반 페이지네이션)
 */
export async function fetchClientHistory(
  email: string,
  cursor?: string,
  limit: number = 20,
): Promise<ClientHistoryResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('email', email);
  queryParams.append('limit', limit.toString());
  if (cursor) {
    queryParams.append('cursor', cursor);
  }

  const url = `${getApiEndpoint('/admin/reservations')}?${queryParams}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '상담 내역 조회에 실패했습니다.' }));
    throw new Error(error.message || '상담 내역 조회에 실패했습니다.');
  }

  const data: ApiResponse<ClientHistoryResponse> = await response.json();
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('상담 내역 조회에 실패했습니다.');
}

