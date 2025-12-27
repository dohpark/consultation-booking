import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addMinutes, isSameDay, eachDayOfInterval, endOfDay } from 'date-fns';
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

export function SlotEditView({
  selectedDate,
  selectedDateRange,
  slots,
  reservations,
  onConfirm,
  onCancel,
}: SlotEditViewProps) {
  // 날짜 범위 모드일 때는 빈 상태로 시작 (사용자가 명시적으로 슬롯을 추가해야 함)
  // 단일 날짜 모드일 때만 해당 날짜의 슬롯을 표시
  const daySlots = selectedDateRange
    ? [] // 날짜 범위 모드: 빈 상태로 시작
    : (() => {
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return slots.filter(slot => {
          const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
          return slotDate === dateKey;
        });
      })();

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

  // 날짜에 예약이 있는지 확인
  const dateHasReservations = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    // 해당 날짜의 슬롯 찾기
    const dateSlots = slots.filter(slot => {
      try {
        const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
        return slotDate === dateKey;
      } catch (error) {
        console.error('[SlotEditView] dateHasReservations - slot 날짜 파싱 오류:', slot.startAt, error);
        return false;
      }
    });
    // 해당 날짜의 슬롯 중 예약이 있는 슬롯이 있는지 확인
    return dateSlots.some(slot => {
      return reservations.some(reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED');
    });
  };

  // 확인 핸들러
  const handleConfirm = () => {
    // 날짜 범위가 있으면 모든 날짜에 슬롯 추가 (단, 예약이 있는 날짜는 제외)
    const allDates = selectedDateRange
      ? eachDayOfInterval({ start: startOfDay(selectedDateRange.start), end: endOfDay(selectedDateRange.end) })
      : [selectedDate];

    // 예약이 없는 날짜만 필터링
    const dates = allDates.filter(date => !dateHasReservations(date));

    // 초기 상태: 각 날짜별로 시간대(HH:mm) -> 슬롯 매핑
    // 날짜 범위 모드일 때는 해당 범위의 모든 슬롯을 고려
    const initialSlotsByDateAndTime = new Map<string, Slot>();

    if (selectedDateRange) {
      // 날짜 범위 모드: 해당 범위의 모든 슬롯을 초기 상태로 고려
      const startDay = startOfDay(selectedDateRange.start);
      const endDay = endOfDay(selectedDateRange.end);
      slots.forEach(slot => {
        const slotDate = parseISO(slot.startAt);
        if (slotDate >= startDay && slotDate <= endDay) {
          const dateKey = format(slotDate, 'yyyy-MM-dd');
          const timeKey = format(slotDate, 'HH:mm');
          const key = `${dateKey}-${timeKey}`;
          initialSlotsByDateAndTime.set(key, slot);
        }
      });
    } else {
      // 단일 날짜 모드: daySlots 사용
      daySlots.forEach(slot => {
        const slotDate = parseISO(slot.startAt);
        const dateKey = format(slotDate, 'yyyy-MM-dd');
        const timeKey = format(slotDate, 'HH:mm');
        const key = `${dateKey}-${timeKey}`;
        initialSlotsByDateAndTime.set(key, slot);
      });
    }

    // 날짜 범위 모드에서 추가된 시간대가 있으면, 해당 날짜 범위의 다른 시간대 슬롯들을 자동 삭제
    const autoDeletedSlotIds = new Set<string>(pendingDeletedSlotIds);
    if (selectedDateRange && pendingAddedSlots.size > 0) {
      // 추가된 시간대 목록
      const addedTimeKeys = new Set(Array.from(pendingAddedSlots));

      // 해당 날짜 범위의 모든 날짜에서, 추가된 시간대가 아닌 기존 슬롯들을 삭제 대상에 추가
      initialSlotsByDateAndTime.forEach((slot, key) => {
        const timeKey = key.substring(key.lastIndexOf('-') + 1);
        if (!addedTimeKeys.has(timeKey)) {
          // 추가된 시간대가 아니면 삭제 대상에 추가 (예약이 없는 슬롯만)
          if (!hasReservations(slot)) {
            autoDeletedSlotIds.add(slot.id);
          }
        }
      });
    }

    // 최종 상태: 삭제되지 않은 슬롯 + 추가된 시간대
    const finalSlotsByDateAndTime = new Set<string>();

    // 초기 슬롯 중 삭제되지 않은 것들 (시간대 기준)
    initialSlotsByDateAndTime.forEach((slot, key) => {
      if (!autoDeletedSlotIds.has(slot.id)) {
        finalSlotsByDateAndTime.add(key);
      }
    });

    // 추가된 시간대들
    pendingAddedSlots.forEach(timeKey => {
      dates.forEach((date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const key = `${dateKey}-${timeKey}`;
        finalSlotsByDateAndTime.add(key);
      });
    });

    // 실제 변경사항 계산: 초기 상태와 최종 상태 비교 (시간대 기준)
    const addedSlots: Array<{ startAt: Date; endAt: Date }> = [];
    const deletedSlotIds: string[] = [];

    // 추가할 슬롯: 초기에는 없었는데 최종에 있는 것 (시간대 기준)
    finalSlotsByDateAndTime.forEach(key => {
      if (!initialSlotsByDateAndTime.has(key)) {
        // 새로 추가할 슬롯
        // key 형식: "2025-12-08-00:00" (날짜-시간)
        const lastDashIndex = key.lastIndexOf('-');
        const dateKey = key.substring(0, lastDashIndex); // "2025-12-08"
        const timeKey = key.substring(lastDashIndex + 1); // "00:00"
        const [hours, minutes] = timeKey.split(':').map(Number);
        const startAt = new Date(dateKey);
        startAt.setHours(hours, minutes, 0, 0);
        const endAt = addMinutes(startAt, 30);
        addedSlots.push({ startAt, endAt });
      }
    });

    // 삭제할 슬롯: 초기에는 있었는데 최종에 없는 것 (시간대 기준)
    initialSlotsByDateAndTime.forEach((slot, key) => {
      if (!finalSlotsByDateAndTime.has(key)) {
        // 예약이 없는 슬롯만 삭제 대상에 추가
        if (!hasReservations(slot)) {
          deletedSlotIds.push(slot.id);
        }
      }
    });

    // 날짜 범위 모드에서 자동 삭제된 슬롯들도 포함 (중복 제거)
    autoDeletedSlotIds.forEach(slotId => {
      if (!deletedSlotIds.includes(slotId)) {
        const slot = Array.from(initialSlotsByDateAndTime.values()).find(s => s.id === slotId);
        if (slot && !hasReservations(slot)) {
          deletedSlotIds.push(slotId);
        }
      }
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
