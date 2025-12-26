import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReservationBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  excludedDates: Date[];
}

export function ReservationBlockedModal({ isOpen, onClose, excludedDates }: ReservationBlockedModalProps) {
  // 제외된 날짜 목록 (최대 5개 표시, 초과 시 "외 N일"로 축약)
  const MAX_DISPLAY_DATES = 5;
  const displayDates = excludedDates.slice(0, MAX_DISPLAY_DATES);
  const remainingCount = excludedDates.length - MAX_DISPLAY_DATES;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-xl border border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Dialog.Title className="text-xl font-bold text-text-primary">일괄 수정 제외 안내</Dialog.Title>
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
            <Dialog.Description className="text-text-secondary space-y-3">
              <p>선택한 날짜 중 예약이 있는 날짜는 일괄 수정에서 제외되었습니다.</p>
              <p>해당 날짜는 달력에서 날짜를 클릭해 개별 수정해주세요.</p>

              {/* 제외된 날짜 목록 */}
              {excludedDates.length > 0 && (
                <div className="bg-bg-secondary rounded-lg p-4 mt-4">
                  <div className="text-sm font-medium text-text-primary mb-2">제외된 날짜:</div>
                  <div className="text-sm text-text-secondary space-y-1">
                    {displayDates.map((date, idx) => (
                      <div key={idx}>{format(date, 'M월 d일 (EEE)', { locale: ko })}</div>
                    ))}
                    {remainingCount > 0 && <div className="text-text-tertiary">외 {remainingCount}일</div>}
                  </div>
                </div>
              )}
            </Dialog.Description>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button onClick={onClose} className="btn-primary">
              확인
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
