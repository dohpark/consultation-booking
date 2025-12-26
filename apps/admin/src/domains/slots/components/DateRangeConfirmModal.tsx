import { useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateRangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  onConfirm: (startDate: Date, endDate: Date) => void;
}

export function DateRangeConfirmModal({ isOpen, onClose, startDate, endDate, onConfirm }: DateRangeConfirmModalProps) {
  // 날짜 범위의 모든 날짜 생성
  const dates = useMemo(
    () => eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) }),
    [startDate, endDate],
  );

  const handleConfirm = () => {
    onConfirm(startDate, endDate);
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
                <div className="mt-2 pt-2 border-t border-border">총 {dates.length}일</div>
              </div>
            </div>
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
