import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addMinutes, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2, Lock } from 'lucide-react';
import type { Slot, Reservation } from '../types';

interface SlotEditViewProps {
  selectedDate: Date;
  selectedDateRange?: { start: Date; end: Date };
  slots: Slot[];
  reservations: Reservation[];
  onConfirm?: (addedSlots: Array<{ startAt: Date; endAt: Date }>, deletedSlotIds: string[]) => void;
  onCancel?: () => void;
}

// 하루를 30분 단위로 나눈 모든 시간대 생성 (00:00 ~ 23:30)
const generateTimeSlots = (date: Date): Date[] => {
  const start = startOfDay(date);
  const slots: Date[] = [];
  for (let i = 0; i < 48; i++) {
    slots.push(addMinutes(start, i * 30));
  }
  return slots;
};

export function SlotEditView({ selectedDate, slots, reservations, onConfirm, onCancel }: SlotEditViewProps) {
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const daySlots = slots.filter(slot => {
    const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
    return slotDate === dateKey;
  });

  // 임시 변경사항 관리
  // selectedDate나 selectedDateRange가 변경되면 컴포넌트가 리마운트되므로
  // 상태가 자동으로 초기화됨 (key prop 사용)
  const [pendingAddedSlots, setPendingAddedSlots] = useState<Set<string>>(new Set());
  const [pendingDeletedSlotIds, setPendingDeletedSlotIds] = useState<Set<string>>(new Set());

  // 컴포넌트 언마운트 시 취소 처리 (모달 닫기 시)
  useEffect(() => {
    return () => {
      // 모달이 닫힐 때 임시 변경사항 초기화
      setPendingAddedSlots(new Set());
      setPendingDeletedSlotIds(new Set());
    };
  }, []);

  // 30분 단위 시간대 생성
  const timeSlots = generateTimeSlots(selectedDate);

  // 각 시간대에 해당하는 슬롯 찾기 (임시 삭제 반영)
  const getSlotForTime = (time: Date): Slot | null => {
    const slot = daySlots.find(slot => {
      const slotStart = parseISO(slot.startAt);
      return (
        slotStart.getHours() === time.getHours() &&
        slotStart.getMinutes() === time.getMinutes() &&
        isSameDay(slotStart, time)
      );
    });

    // 삭제 예정인 슬롯은 null 반환
    if (slot && pendingDeletedSlotIds.has(slot.id)) {
      return null;
    }

    return slot || null;
  };

  // 시간대에 슬롯이 추가 예정인지 확인
  const isPendingAdded = (time: Date): boolean => {
    const timeKey = format(time, 'HH:mm');
    return pendingAddedSlots.has(timeKey);
  };

  // 슬롯에 예약이 있는지 확인
  const hasReservations = (slot: Slot): boolean => {
    return reservations.some(reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED');
  };

  // 슬롯이 잠겨있는지 확인 (예약이 있으면 잠금)
  const isLocked = (slot: Slot | null): boolean => {
    return slot !== null && hasReservations(slot);
  };

  // 슬롯 추가 핸들러 (임시 상태에만 반영)
  const handleAddSlot = (time: Date) => {
    const timeKey = format(time, 'HH:mm');
    setPendingAddedSlots(prev => new Set(prev).add(timeKey));
    // 추가 예정이었던 슬롯의 삭제 예정을 취소
    const slot = getSlotForTime(time);
    if (slot && pendingDeletedSlotIds.has(slot.id)) {
      setPendingDeletedSlotIds(prev => {
        const next = new Set(prev);
        next.delete(slot.id);
        return next;
      });
    }
  };

  // 슬롯 삭제 핸들러 (임시 상태에만 반영)
  const handleDeleteSlot = (slotId: string) => {
    setPendingDeletedSlotIds(prev => new Set(prev).add(slotId));
    // 삭제 예정인 슬롯의 추가 예정을 취소
    const slot = daySlots.find(s => s.id === slotId);
    if (slot) {
      const slotStart = parseISO(slot.startAt);
      const timeKey = format(slotStart, 'HH:mm');
      if (pendingAddedSlots.has(timeKey)) {
        setPendingAddedSlots(prev => {
          const next = new Set(prev);
          next.delete(timeKey);
          return next;
        });
      }
    }
  };

  // 확인 핸들러
  const handleConfirm = () => {
    const addedSlots: Array<{ startAt: Date; endAt: Date }> = [];
    const deletedSlotIds = Array.from(pendingDeletedSlotIds);

    // 추가 예정인 슬롯들을 실제 시간으로 변환
    pendingAddedSlots.forEach(timeKey => {
      const [hours, minutes] = timeKey.split(':').map(Number);
      const startAt = new Date(selectedDate);
      startAt.setHours(hours, minutes, 0, 0);
      const endAt = addMinutes(startAt, 30);
      addedSlots.push({ startAt, endAt });
    });

    onConfirm?.(addedSlots, deletedSlotIds);
  };

  // 취소 핸들러
  const handleCancel = () => {
    setPendingAddedSlots(new Set());
    setPendingDeletedSlotIds(new Set());
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary mb-4">
        <p>30분 단위로 슬롯을 관리할 수 있습니다. 예약이 있는 슬롯은 삭제할 수 없습니다.</p>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {timeSlots.map(time => {
          const slot = getSlotForTime(time);
          const locked = isLocked(slot);
          const timeStr = format(time, 'HH:mm', { locale: ko });
          const nextTime = addMinutes(time, 30);
          const nextTimeStr = format(nextTime, 'HH:mm', { locale: ko });

          return (
            <div
              key={time.toISOString()}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                slot
                  ? locked
                    ? 'bg-bg-secondary border-border'
                    : 'bg-primary-light border-primary'
                  : isPendingAdded(time)
                    ? 'bg-primary-light border-primary'
                    : 'bg-bg-secondary border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="font-medium text-text-primary min-w-[100px]">
                  {timeStr} ~ {nextTimeStr}
                </div>
                {slot ? (
                  <>
                    {locked && (
                      <div className="flex items-center gap-1 text-text-tertiary text-sm">
                        <Lock size={16} />
                        <span>예약 있음</span>
                      </div>
                    )}
                    <div className="text-sm text-text-secondary">
                      예약: {slot.bookedCount}명 / 최대: {slot.capacity}명
                    </div>
                  </>
                ) : isPendingAdded(time) ? (
                  <div className="text-sm text-primary">슬롯 추가 예정</div>
                ) : (
                  <div className="text-sm text-text-tertiary">슬롯 없음</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {slot || isPendingAdded(time) ? (
                  <>
                    {!locked && (
                      <button
                        onClick={() => {
                          if (slot) {
                            handleDeleteSlot(slot.id);
                          } else {
                            // 추가 예정인 슬롯 취소
                            const timeKey = format(time, 'HH:mm');
                            setPendingAddedSlots(prev => {
                              const next = new Set(prev);
                              next.delete(timeKey);
                              return next;
                            });
                          }
                        }}
                        className="p-2 text-text-secondary hover:text-error transition-colors"
                        aria-label="슬롯 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {locked && <div className="text-xs text-text-tertiary px-2">예약 있음</div>}
                  </>
                ) : (
                  <button
                    onClick={() => handleAddSlot(time)}
                    className="px-3 py-1.5 text-sm text-primary hover:bg-primary-light rounded transition-colors"
                  >
                    슬롯 추가
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 확인/취소 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
        <button onClick={handleCancel} className="btn-outline">
          취소
        </button>
        <button onClick={handleConfirm} className="btn-primary">
          확인
        </button>
      </div>
    </div>
  );
}
