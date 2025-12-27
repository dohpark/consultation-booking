import type { Slot } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 특정 날짜의 슬롯 목록 조회
 */
export async function fetchSlotsByDate(date: string, token: string): Promise<Slot[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('date', date);
  queryParams.append('token', token);
  // 로컬 시간대 오프셋 추가 (분 단위, 한국 KST의 경우 -540)
  queryParams.append('offset', new Date().getTimezoneOffset().toString());

  const url = `${getApiEndpoint('/public/slots')}?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '슬롯 조회에 실패했습니다.' }));
    throw new Error(error.message || '슬롯 조회에 실패했습니다.');
  }

  const data: ApiResponse<Slot[]> = await response.json();

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('슬롯 조회에 실패했습니다.');
}

/**
 * 날짜 범위의 슬롯 목록 조회
 */
export async function fetchSlotsByDateRange(from: string, to: string, token: string): Promise<Slot[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('from', from);
  queryParams.append('to', to);
  queryParams.append('token', token);
  // 로컬 시간대 오프셋 추가 (분 단위, 한국 KST의 경우 -540)
  queryParams.append('offset', new Date().getTimezoneOffset().toString());

  const url = `${getApiEndpoint('/public/slots')}?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '슬롯 조회에 실패했습니다.' }));
    throw new Error(error.message || '슬롯 조회에 실패했습니다.');
  }

  const data: ApiResponse<Slot[]> = await response.json();

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('슬롯 조회에 실패했습니다.');
}
