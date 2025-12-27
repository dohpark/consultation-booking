import type { Slot, CreateSlotDto, UpdateSlotDto } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export const SLOTS_ENDPOINTS = {
  LIST: getApiEndpoint('/admin/slots'),
  CREATE: getApiEndpoint('/admin/slots'),
  GET: (id: string) => getApiEndpoint(`/slots/${id}`),
  UPDATE: (id: string) => getApiEndpoint(`/slots/${id}`),
  DELETE: (id: string) => getApiEndpoint(`/slots/${id}`),
} as const;

export async function fetchSlots(params: { from: string; to: string }): Promise<Slot[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('from', params.from);
  queryParams.append('to', params.to);

  const url = `${SLOTS_ENDPOINTS.LIST}?${queryParams}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '슬롯 조회에 실패했습니다.' }));
    throw new Error(error.message || '슬롯 조회에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : [];
}

export async function createSlot(dto: CreateSlotDto): Promise<Slot> {
  const response = await fetch(SLOTS_ENDPOINTS.CREATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '슬롯 생성에 실패했습니다.' }));
    const errorMessage = error.message || '슬롯 생성에 실패했습니다.';

    // 409 Conflict: 중복 슬롯
    if (response.status === 409) {
      throw new Error('이미 존재하는 슬롯입니다.');
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data;
}

export async function updateSlot(id: string, dto: UpdateSlotDto): Promise<Slot> {
  const response = await fetch(SLOTS_ENDPOINTS.UPDATE(id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update slot' }));
    throw new Error(error.message || 'Failed to update slot');
  }

  const data = await response.json();
  return data.data;
}

export async function deleteSlot(id: string): Promise<void> {
  const response = await fetch(SLOTS_ENDPOINTS.DELETE(id), {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete slot' }));
    throw new Error(error.message || 'Failed to delete slot');
  }
}
