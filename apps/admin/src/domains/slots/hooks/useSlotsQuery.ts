import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSlots } from '../services/slotsService';
import type { Slot } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const SLOTS_QUERY_KEYS = {
  all: ['slots'] as const,
  list: (from: string, to: string) => [...SLOTS_QUERY_KEYS.all, 'list', from, to] as const,
  byDate: (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const from = format(monthStart, 'yyyy-MM-dd');
    const to = format(monthEnd, 'yyyy-MM-dd');
    return SLOTS_QUERY_KEYS.list(from, to);
  },
} as const;

export function useSlotsQuery(currentDate?: Date) {
  const monthStart = currentDate ? startOfMonth(currentDate) : null;
  const monthEnd = currentDate ? endOfMonth(currentDate) : null;
  const from = monthStart ? format(monthStart, 'yyyy-MM-dd') : null;
  const to = monthEnd ? format(monthEnd, 'yyyy-MM-dd') : null;

  const query = useQuery<Slot[]>({
    queryKey: from && to ? SLOTS_QUERY_KEYS.list(from, to) : SLOTS_QUERY_KEYS.all,
    queryFn: () => {
      if (!from || !to) {
        return Promise.resolve([]);
      }
      return fetchSlots({ from, to });
    },
    enabled: !!currentDate && !!from && !!to,
  });

  const queryClient = useQueryClient();

  const refreshSlots = () => {
    if (from && to) {
      queryClient.invalidateQueries({ queryKey: SLOTS_QUERY_KEYS.list(from, to) });
    }
  };

  return {
    slots: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refreshSlots,
  };
}

