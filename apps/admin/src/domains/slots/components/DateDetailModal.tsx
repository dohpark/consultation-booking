import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  children?: React.ReactNode;
}

export function DateDetailModal({ isOpen, onClose, selectedDate, children }: DateDetailModalProps) {
  const dateTitle = selectedDate ? format(selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko }) : '';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-border max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Dialog.Title className="text-xl font-bold text-text-primary">{dateTitle}</Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
