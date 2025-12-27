import type { CreateInvitationDto, InvitationResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export const INVITATIONS_ENDPOINTS = {
  CREATE: getApiEndpoint('/admin/invitations'),
} as const;

export async function createInvitation(dto: CreateInvitationDto): Promise<InvitationResponse> {
  const response = await fetch(INVITATIONS_ENDPOINTS.CREATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '초대 링크 생성에 실패했습니다.' }));
    throw new Error(error.message || '초대 링크 생성에 실패했습니다.');
  }

  const data = await response.json();
  return data.data;
}

