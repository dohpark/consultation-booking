import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Slot } from '../../slots/types';

interface ReservationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot;
  onSubmit: (name: string, email?: string, note?: string) => void;
  isLoading?: boolean;
  error?: string | null;
  defaultEmail?: string;
}

export function ReservationConfirmModal({
  isOpen,
  onClose,
  slot,
  onSubmit,
  isLoading = false,
  error = null,
  defaultEmail,
}: ReservationConfirmModalProps) {
  const startTime = format(parseISO(slot.startAt), 'HH:mm', { locale: ko });
  const endTime = format(parseISO(slot.endAt), 'HH:mm', { locale: ko });
  const date = format(parseISO(slot.startAt), 'yyyy년 MM월 dd일 (EEE)', { locale: ko });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string | undefined;
    const note = formData.get('note') as string | undefined;

    if (!name.trim()) {
      return;
    }

    onSubmit(name.trim(), email?.trim() || undefined, note?.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-bg-primary rounded-xl shadow-xl border border-border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Dialog.Title className="text-xl font-bold text-text-primary">예약 확인</Dialog.Title>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 예약 정보 */}
            <div className="bg-bg-secondary rounded-lg p-4 space-y-2">
              <div className="text-sm text-text-secondary">예약 날짜</div>
              <div className="text-lg font-semibold text-text-primary">{date}</div>
              <div className="text-sm text-text-secondary">예약 시간</div>
              <div className="text-lg font-semibold text-text-primary">
                {startTime} - {endTime}
              </div>
              <div className="text-sm text-text-secondary">잔여 자리</div>
              <div className="text-lg font-semibold text-text-primary">
                {slot.availableCount} / {slot.capacity}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* 입력 필드 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                  이름 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-bg-tertiary disabled:cursor-not-allowed"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={defaultEmail}
                  readOnly
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-bg-tertiary text-text-secondary cursor-not-allowed focus:outline-none disabled:opacity-50"
                  placeholder={defaultEmail || '이메일'}
                />
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium text-text-primary mb-2">
                  메모 <span className="text-text-tertiary text-xs">(선택사항)</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-bg-tertiary disabled:cursor-not-allowed resize-none"
                  placeholder="상담 관련 메모를 입력하세요 (선택사항)"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '예약 중...' : '예약 확정'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

