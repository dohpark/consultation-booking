import type { ValidateTokenResponse, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

/**
 * 토큰 검증
 */
export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  const url = `${getApiEndpoint('/public/invitations/validate')}?token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '토큰 검증에 실패했습니다.' }));
    throw new Error(error.message || '토큰 검증에 실패했습니다.');
  }

  const data: ApiResponse<ValidateTokenResponse> = await response.json();

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('토큰 검증에 실패했습니다.');
}
