import { Dialog } from '@headlessui/react';
import { CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Reservation } from '../types';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
}

export function ReservationSuccessModal({ isOpen, onClose, reservation }: ReservationSuccessModalProps) {
  const date = format(parseISO(reservation.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-bg-primary rounded-xl shadow-xl border border-border">
          {/* Content */}
          <div className="p-6 space-y-6 text-center">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>

            {/* Title */}
            <div>
              <Dialog.Title className="text-2xl font-bold text-text-primary mb-2">예약이 완료되었습니다</Dialog.Title>
              <Dialog.Description className="text-text-secondary">
                예약이 성공적으로 생성되었습니다.
              </Dialog.Description>
            </div>

            {/* Reservation Info */}
            <div className="bg-bg-secondary rounded-lg p-4 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">예약자</span>
                <span className="font-semibold text-text-primary">{reservation.name}</span>
              </div>
              {reservation.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">이메일</span>
                  <span className="font-semibold text-text-primary">{reservation.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">예약 일시</span>
                <span className="font-semibold text-text-primary">{date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">상태</span>
                <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">예약 완료</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

