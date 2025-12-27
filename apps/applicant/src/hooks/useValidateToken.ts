import { useQuery } from '@tanstack/react-query';
import { validateToken } from '../services/invitationsService';

export const TOKEN_QUERY_KEYS = {
  all: ['token'] as const,
  validate: (token: string) => [...TOKEN_QUERY_KEYS.all, 'validate', token] as const,
} as const;

export function useValidateToken(token: string | null) {
  return useQuery({
    queryKey: token ? TOKEN_QUERY_KEYS.validate(token) : ['token', 'validate', 'no-token'],
    queryFn: () => {
      if (!token) {
        throw new Error('토큰이 필요합니다.');
      }
      return validateToken(token);
    },
    enabled: !!token, // token이 있을 때만 실행
    retry: false, // 토큰 검증 실패 시 재시도하지 않음
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });
}

