import { useQuery } from '@tanstack/react-query';
import { fetchSlotsByDate } from '../services/slotsService';
import type { Slot } from '../types';

export const SLOTS_QUERY_KEYS = {
  all: ['slots'] as const,
  byDate: (date: string, token: string) => [...SLOTS_QUERY_KEYS.all, 'date', date, token] as const,
} as const;

export function useSlots(date: string | null, token: string | null) {
  return useQuery<Slot[]>({
    queryKey: date && token ? SLOTS_QUERY_KEYS.byDate(date, token) : ['slots', 'no-date-or-token'],
    queryFn: () => {
      if (!date || !token) {
        throw new Error('날짜와 토큰이 필요합니다.');
      }
      return fetchSlotsByDate(date, token);
    },
    enabled: !!date && !!token, // date와 token이 모두 있을 때만 실행
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });
}

