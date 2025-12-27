import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_ENDPOINTS } from '../constants';
import type { User } from '../types';

export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  profile: () => [...AUTH_QUERY_KEYS.all, 'profile'] as const,
} as const;

async function fetchProfile(): Promise<User | null> {
  const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data.success && data.data) {
    return data.data;
  }

  return null;
}

async function logout(): Promise<void> {
  // HTTP-only 쿠키는 백엔드에서만 삭제 가능
  await fetch(AUTH_ENDPOINTS.LOGOUT, {
    method: 'POST',
    credentials: 'include',
  });
  // 에러가 발생해도 쿠키 삭제는 시도했으므로 성공으로 처리
}

export function useAuthQuery() {
  const query = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEYS.profile(),
    queryFn: fetchProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });

  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile(), null);
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    refetch: query.refetch,
    logout: logoutMutation.mutate,
  };
}
