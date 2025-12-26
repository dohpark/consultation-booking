import { AUTH_ENDPOINTS } from '../constants';
import type { User } from '../types';

interface GoogleLoginResponse {
  success: boolean;
  data?: {
    user: {
      email: string;
      name: string;
    };
  };
  message?: string;
}

interface ProfileResponse {
  success: boolean;
  data?: User;
  message?: string;
}

export async function loginWithGoogle(idToken: string): Promise<void> {
  const response = await fetch(AUTH_ENDPOINTS.GOOGLE_LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });

  const isResponseOk = response.ok;
  if (!isResponseOk) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP ${response.status}: Login failed`);
  }
}

export async function fetchUserProfile(): Promise<User> {
  const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
    credentials: 'include',
  });

  const isResponseOk = response.ok;
  if (!isResponseOk) {
    throw new Error('Failed to fetch user profile');
  }

  const data: ProfileResponse = await response.json();
  const hasValidUserData = data.success && data.data;
  if (!hasValidUserData) {
    throw new Error('Failed to fetch user profile');
  }

  return data.data;
}

