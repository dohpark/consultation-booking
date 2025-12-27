import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2, Edit2, History } from 'lucide-react';
import type { Slot, Reservation } from '../types';

interface ReservationViewProps {
  selectedDate: Date;
  slots: Slot[];
  reservations: Reservation[];
  onCancelReservation?: (reservationId: string) => void;
  onEditReservation?: (reservation: Reservation) => void;
  onViewClientHistory?: (email: string, name: string) => void;
}

export function ReservationView({
  selectedDate,
  slots,
  reservations,
  onCancelReservation,
  onEditReservation,
  onViewClientHistory,
}: ReservationViewProps) {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const daySlots = slots.filter(slot => {
    const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
    return slotDate === dateKey;
  });

  // 슬롯별로 예약 그룹화
  const reservationsBySlot = daySlots.reduce(
    (acc, slot) => {
      const slotReservations = reservations.filter(
        reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED',
      );
      if (slotReservations.length > 0) {
        acc[slot.id] = slotReservations;
      }
      return acc;
    },
    {} as Record<string, Reservation[]>,
  );

  if (daySlots.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>이 날짜에는 예약 가능한 슬롯이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {daySlots.map(slot => {
        const slotReservations = reservationsBySlot[slot.id] || [];
        const startTime = format(parseISO(slot.startAt), 'HH:mm', { locale: ko });
        const endTime = format(parseISO(slot.endAt), 'HH:mm', { locale: ko });

        return (
          <div key={slot.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {startTime} ~ {endTime}
                </h3>
                <p className="text-sm text-text-secondary">
                  예약: {slotReservations.length}명 / 최대: {slot.capacity}명
                </p>
              </div>
            </div>

            {slotReservations.length === 0 ? (
              <div className="text-text-tertiary text-sm py-2">예약자가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {slotReservations.map(reservation => (
                  <div
                    key={reservation.id}
                    className="flex items-start justify-between p-3 bg-bg-secondary rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{reservation.name}</div>
                      <div className="text-sm text-text-secondary mt-1">{reservation.email}</div>
                      {reservation.note && <div className="text-sm text-text-tertiary mt-2">{reservation.note}</div>}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {onViewClientHistory && (
                        <button
                          onClick={() => onViewClientHistory(reservation.email, reservation.name)}
                          className="p-2 text-text-secondary hover:text-primary transition-colors"
                          aria-label="상담 내역 조회"
                        >
                          <History size={18} />
                        </button>
                      )}
                      {onEditReservation && (
                        <button
                          onClick={() => onEditReservation(reservation)}
                          className="p-2 text-text-secondary hover:text-primary transition-colors"
                          aria-label="예약 수정"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      {onCancelReservation && (
                        <button
                          onClick={() => onCancelReservation(reservation.id)}
                          className="p-2 text-text-secondary hover:text-error transition-colors"
                          aria-label="예약 취소"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
