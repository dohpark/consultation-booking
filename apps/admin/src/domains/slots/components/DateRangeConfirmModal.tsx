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
  const dates = eachDayOfInterval({ start: startOfDay(startDate), end: endOfDay(endDate) });

  const handleConfirm = () => {
    // onConfirm을 먼저 호출하여 상태 업데이트 후 onClose 호출
    onConfirm(startDate, endDate);
    // onClose는 onConfirm이 완료된 후 호출 (하지만 onClose에서 setSelectedDateRange(null)이 실행되므로 주의)
    // 따라서 onClose는 호출하지 않고, 부모에서 setIsDateRangeModalOpen(false)를 직접 처리
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
              선택한 날짜 범위에 대해 슬롯 편집 모달을 열까요?
            </Dialog.Description>

            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="text-sm font-medium text-text-primary mb-2">선택된 날짜:</div>
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
