import { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, eachDayOfInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Slot, Reservation } from '../types';

export type DateRangeOption = 'exclude' | 'include';

interface DateRangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  slots: Slot[];
  reservations: Reservation[];
  onConfirm: (startDate: Date, endDate: Date, option: DateRangeOption) => void;
}

export function DateRangeConfirmModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  slots,
  reservations,
  onConfirm,
}: DateRangeConfirmModalProps) {
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>('exclude');

  // 날짜 범위의 모든 날짜 생성
  const dates = useMemo(
    () => eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) }),
    [startDate, endDate],
  );

  // 날짜 범위 내 예약이 있는 날짜와 슬롯 계산
  const conflictInfo = useMemo(() => {
    const datesWithReservations = new Set<string>();
    let protectedSlotsCount = 0;

    dates.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dateSlots = slots.filter(slot => {
        const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
        return slotDate === dateKey;
      });

      const hasReservations = dateSlots.some(slot => {
        return reservations.some(reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED');
      });

      if (hasReservations) {
        datesWithReservations.add(dateKey);
        // 예약이 있는 슬롯 수 계산
        const slotsWithReservations = dateSlots.filter(slot => {
          return reservations.some(reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED');
        });
        protectedSlotsCount += slotsWithReservations.length;
      }
    });

    return {
      excludedDatesCount: datesWithReservations.size,
      protectedSlotsCount,
      totalDatesCount: dates.length,
      applicableDatesCount: dates.length - datesWithReservations.size,
    };
  }, [dates, slots, reservations]);

  const handleConfirm = () => {
    onConfirm(startDate, endDate, selectedOption);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl border border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Dialog.Title className="text-xl font-bold text-text-primary">날짜 범위 선택</Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <Dialog.Description className="text-text-secondary">
              선택한 날짜 범위에 대해 슬롯 편집을 적용할까요?
            </Dialog.Description>

            {/* 적용 대상 날짜 정보 */}
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="text-sm font-medium text-text-primary mb-2">적용 대상:</div>
              <div className="text-sm text-text-secondary space-y-1">
                <div>시작: {format(startDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}</div>
                <div>종료: {format(endDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}</div>
                <div className="mt-2 pt-2 border-t border-border">총 {conflictInfo.totalDatesCount}일</div>
              </div>
            </div>

            {/* 예약 충돌 정보 */}
            {conflictInfo.excludedDatesCount > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="text-sm font-medium text-text-primary mb-2">예약 충돌 정보:</div>
                <div className="text-sm text-text-secondary space-y-1">
                  <div>예약이 있는 날짜: {conflictInfo.excludedDatesCount}일</div>
                  <div>보호 슬롯 수: {conflictInfo.protectedSlotsCount}개</div>
                  <div className="text-text-primary font-medium mt-2">
                    적용 가능한 날짜: {conflictInfo.applicableDatesCount}일
                  </div>
                </div>
              </div>
            )}

            {/* 옵션 선택 */}
            {conflictInfo.excludedDatesCount > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-text-primary">적용 옵션 선택:</div>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors">
                    <input
                      type="radio"
                      name="dateRangeOption"
                      value="exclude"
                      checked={selectedOption === 'exclude'}
                      onChange={() => setSelectedOption('exclude')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">옵션 A: 예약이 있는 날짜 제외</div>
                      <div className="text-xs text-text-secondary mt-1">
                        예약이 있는 {conflictInfo.excludedDatesCount}일을 제외하고 {conflictInfo.applicableDatesCount}
                        일에만 적용됩니다.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors">
                    <input
                      type="radio"
                      name="dateRangeOption"
                      value="include"
                      checked={selectedOption === 'include'}
                      onChange={() => setSelectedOption('include')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">
                        옵션 B: 모든 날짜 포함 (보호 슬롯 유지)
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        모든 {conflictInfo.totalDatesCount}일에 적용되며, 예약이 있는 {conflictInfo.protectedSlotsCount}
                        개 슬롯은 보호됩니다.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button onClick={onClose} className="btn-outline">
              취소
            </button>
            <button onClick={handleConfirm} className="btn-primary">
              확인
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
