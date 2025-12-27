import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchReservationsBySlotIds } from '../services/reservationsService';
import type { Reservation } from '../types';
import type { Slot } from '../types';

export const RESERVATIONS_QUERY_KEYS = {
  all: ['reservations'] as const,
  bySlotIds: (slotIds: string[]) => [...RESERVATIONS_QUERY_KEYS.all, 'slots', ...slotIds.sort()] as const,
} as const;

interface UseReservationsOptions {
  slots?: Slot[];
}

export function useReservations(options?: UseReservationsOptions) {
  const queryClient = useQueryClient();
  const slotIds = options?.slots?.map(slot => slot.id) || [];

  // 슬롯 목록이 있을 때만 예약 조회
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: RESERVATIONS_QUERY_KEYS.bySlotIds(slotIds),
    queryFn: () => fetchReservationsBySlotIds(slotIds),
    enabled: slotIds.length > 0,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });

  const cancelReservation = useCallback(
    (reservationId: string) => {
      // TODO: API 연동 후 활성화
      // 예약 취소 API 호출 후 예약 목록 갱신
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEYS.all });
    },
    [queryClient],
  );

  const editReservation = useCallback((reservation: Reservation) => {
    // TODO: 예약 수정 모달 오픈
    console.log('Edit reservation:', reservation);
  }, []);

  const refreshReservations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEYS.all });
  }, [queryClient]);

  return {
    reservations,
    isLoading,
    cancelReservation,
    editReservation,
    refreshReservations,
  };
}
