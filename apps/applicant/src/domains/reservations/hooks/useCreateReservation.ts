import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReservation } from '../services/reservationsService';
import type { CreateReservationDto, Reservation } from '../types';
import { SLOTS_QUERY_KEYS } from '../../slots/hooks/useSlotsByMonth';

export const RESERVATIONS_QUERY_KEYS = {
  all: ['reservations'] as const,
} as const;

/**
 * 예약 생성 mutation 훅
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation<Reservation, Error, CreateReservationDto>({
    mutationFn: createReservation,
    onSuccess: () => {
      // 예약 생성 성공 시 슬롯 목록 갱신
      queryClient.invalidateQueries({ queryKey: SLOTS_QUERY_KEYS.all });
    },
  });
}

