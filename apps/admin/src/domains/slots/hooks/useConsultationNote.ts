import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConsultationNote, upsertConsultationNote, type UpsertConsultationNoteDto } from '../services/consultationNotesService';
import type { ConsultationNote } from '../services/consultationNotesService';

export const CONSULTATION_NOTE_QUERY_KEYS = {
  all: ['consultationNote'] as const,
  byReservationId: (reservationId: string) => [...CONSULTATION_NOTE_QUERY_KEYS.all, reservationId] as const,
} as const;

/**
 * 상담 노트 조회
 */
export function useConsultationNote(reservationId: string, enabled: boolean = true) {
  return useQuery<ConsultationNote | null, Error>({
    queryKey: CONSULTATION_NOTE_QUERY_KEYS.byReservationId(reservationId),
    queryFn: () => fetchConsultationNote(reservationId),
    enabled: enabled && !!reservationId,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });
}

/**
 * 상담 노트 저장 (Upsert)
 */
export function useUpsertConsultationNote() {
  const queryClient = useQueryClient();

  return useMutation<ConsultationNote, Error, { reservationId: string; dto: UpsertConsultationNoteDto }>({
    mutationFn: ({ reservationId, dto }) => upsertConsultationNote(reservationId, dto),
    onSuccess: (data, variables) => {
      // 해당 예약의 노트 쿼리 무효화 및 업데이트
      queryClient.setQueryData(CONSULTATION_NOTE_QUERY_KEYS.byReservationId(variables.reservationId), data);
      // 예약 목록도 무효화하여 노트 여부 표시 업데이트
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

