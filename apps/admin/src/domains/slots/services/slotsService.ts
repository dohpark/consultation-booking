import type { Slot, CreateSlotDto, UpdateSlotDto } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export const SLOTS_ENDPOINTS = {
  LIST: getApiEndpoint('/slots'),
  CREATE: getApiEndpoint('/admin/slots'),
  GET: (id: string) => getApiEndpoint(`/slots/${id}`),
  UPDATE: (id: string) => getApiEndpoint(`/slots/${id}`),
  DELETE: (id: string) => getApiEndpoint(`/slots/${id}`),
} as const;

export async function fetchSlots(params?: { startDate?: string; endDate?: string }): Promise<Slot[]> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = queryParams.toString() ? `${SLOTS_ENDPOINTS.LIST}?${queryParams}` : SLOTS_ENDPOINTS.LIST;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch slots');
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
