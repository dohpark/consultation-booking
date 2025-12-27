import { useQuery } from '@tanstack/react-query';
import { fetchSlotsByDateRange } from '../services/slotsService';
import type { Slot } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const SLOTS_QUERY_KEYS = {
  all: ['slots'] as const,
  byDate: (date: string, token: string) => [...SLOTS_QUERY_KEYS.all, 'date', date, token] as const,
  byMonth: (from: string, to: string, token: string) => [...SLOTS_QUERY_KEYS.all, 'month', from, to, token] as const,
} as const;

/**
 * 월 단위 슬롯 조회 훅
 */
export function useSlotsByMonth(currentDate: Date | null, token: string | null) {
  const monthStart = currentDate ? startOfMonth(currentDate) : null;
  const monthEnd = currentDate ? endOfMonth(currentDate) : null;
  const from = monthStart ? format(monthStart, 'yyyy-MM-dd') : null;
  const to = monthEnd ? format(monthEnd, 'yyyy-MM-dd') : null;

  return useQuery<Slot[]>({
    queryKey: from && to && token ? SLOTS_QUERY_KEYS.byMonth(from, to, token) : ['slots', 'no-month-or-token'],
    queryFn: () => {
      if (!from || !to || !token) {
        throw new Error('날짜 범위와 토큰이 필요합니다.');
      }
      return fetchSlotsByDateRange(from, to, token);
    },
    enabled: !!currentDate && !!from && !!to && !!token,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });
}
