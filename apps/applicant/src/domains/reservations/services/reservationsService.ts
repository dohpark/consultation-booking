import type { Reservation, CreateReservationDto, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

/**
 * 예약 생성
 */
export async function createReservation(dto: CreateReservationDto): Promise<Reservation> {
  const url = getApiEndpoint('/public/reservations');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '예약 생성에 실패했습니다.' }));
    
    // 409 Conflict: 인원 초과 또는 중복 예약
    if (response.status === 409) {
      const errorMessage = error.message || '예약할 수 없습니다.';
      if (errorMessage.includes('이미 예약')) {
        throw new Error('이미 예약된 이메일입니다.');
      }
      if (errorMessage.includes('가득')) {
        throw new Error('슬롯이 가득 찼습니다.');
      }
      throw new Error(errorMessage);
    }

    // 400 Bad Request: 슬롯이 가득 찼습니다
    if (response.status === 400) {
      const errorMessage = error.message || '예약할 수 없습니다.';
      if (errorMessage.includes('가득')) {
        throw new Error('슬롯이 가득 찼습니다.');
      }
      throw new Error(errorMessage);
    }

    throw new Error(error.message || '예약 생성에 실패했습니다.');
  }

  const data: ApiResponse<Reservation> = await response.json();

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('예약 생성에 실패했습니다.');
}

