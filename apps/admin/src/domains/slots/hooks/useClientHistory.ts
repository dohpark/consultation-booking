import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchClientHistory } from '../services/reservationsService';
import type { ClientHistoryItem } from '../services/reservationsService';

export const CLIENT_HISTORY_QUERY_KEYS = {
  all: ['clientHistory'] as const,
  byEmail: (email: string) => [...CLIENT_HISTORY_QUERY_KEYS.all, email] as const,
} as const;

interface UseClientHistoryOptions {
  email: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * 클라이언트 상담 내역 조회 (무한 스크롤)
 */
export function useClientHistory({ email, limit = 20, enabled = true }: UseClientHistoryOptions) {
  return useInfiniteQuery<{ items: ClientHistoryItem[]; nextCursor?: string; hasMore: boolean }, Error>({
    queryKey: CLIENT_HISTORY_QUERY_KEYS.byEmail(email),
    queryFn: ({ pageParam }) => fetchClientHistory(email, pageParam as string | undefined, limit),
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !!email,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });
}

