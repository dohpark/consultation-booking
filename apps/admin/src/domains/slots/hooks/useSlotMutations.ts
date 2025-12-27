import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSlot, deleteSlot } from '../services/slotsService';
import type { CreateSlotDto, Slot } from '../types';
import { SLOTS_QUERY_KEYS } from './useSlotsQuery';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation<Slot, Error, CreateSlotDto>({
    mutationFn: createSlot,
    onSuccess: (newSlot, variables) => {
      // 슬롯의 날짜를 기반으로 해당 월의 쿼리 무효화
      const slotDate = new Date(variables.startAt);
      const monthStart = startOfMonth(slotDate);
      const monthEnd = endOfMonth(slotDate);
      const from = format(monthStart, 'yyyy-MM-dd');
      const to = format(monthEnd, 'yyyy-MM-dd');

      queryClient.invalidateQueries({ queryKey: SLOTS_QUERY_KEYS.list(from, to) });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteSlot,
    onSuccess: () => {
      // 모든 슬롯 쿼리 무효화 (삭제된 슬롯의 날짜를 알 수 없으므로)
      queryClient.invalidateQueries({ queryKey: SLOTS_QUERY_KEYS.all });
    },
  });
}
