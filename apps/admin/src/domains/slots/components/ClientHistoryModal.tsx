import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useClientHistory } from '../hooks/useClientHistory';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { ConsultationNoteModal } from './ConsultationNoteModal';
import type { Reservation } from '../types';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
}

export function ClientHistoryModal({ isOpen, onClose, clientEmail, clientName }: ClientHistoryModalProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useClientHistory({
    email: clientEmail,
    enabled: isOpen,
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  // 무한 스크롤: 스크롤이 하단에 도달하면 다음 페이지 로드
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 모든 페이지의 아이템을 평탄화
  const allItems = data?.pages.flatMap(page => page.items) || [];

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm', { locale: ko });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">예약 완료</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-medium bg-error/20 text-error rounded">취소됨</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-success/20 text-success rounded">완료</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-border max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Dialog.Title className="text-xl font-bold text-text-primary">{clientName}님의 상담 내역</Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-bg-secondary rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
                <p className="text-sm text-error">
                  {error instanceof Error ? error.message : '상담 내역을 불러오는 중 오류가 발생했습니다.'}
                </p>
              </div>
            )}

            {!isLoading && !isError && allItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary">상담 내역이 없습니다.</p>
              </div>
            )}

            {!isLoading && !isError && allItems.length > 0 && (
              <div className="space-y-4">
                {allItems.map(item => (
                  <div
                    key={item.id}
                    className={`bg-bg-secondary rounded-lg p-4 border border-border transition-colors ${
                      item.hasNote ? 'hover:border-primary cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (item.hasNote) {
                        setSelectedReservation({
                          id: item.id,
                          slotId: item.slotId,
                          email: item.email,
                          name: item.name,
                          status: item.status,
                          createdAt: item.createdAt,
                          updatedAt: item.createdAt,
                        });
                        setIsNoteModalOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-text-primary">
                            {formatDateTime(item.slot.startAt)}
                          </span>
                          {getStatusBadge(item.status)}
                          {item.hasNote && (
                            <span className="px-2 py-1 text-xs font-medium bg-info/20 text-info rounded">
                              노트 있음
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <div>
                            시간: {formatTime(item.slot.startAt)} - {formatTime(item.slot.endAt)}
                          </div>
                          <div>상담사: {item.slot.counselor.name}</div>
                          <div>예약일: {format(parseISO(item.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 무한 스크롤 트리거 */}
                {hasNextPage && (
                  <div ref={ref} className="py-4">
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-3 text-text-secondary text-sm">더 불러오는 중...</span>
                      </div>
                    )}
                  </div>
                )}

                {!hasNextPage && allItems.length > 0 && (
                  <div className="text-center py-4 text-text-tertiary text-sm">모든 내역을 불러왔습니다.</div>
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>

      {/* Consultation Note Modal */}
      {selectedReservation && (
        <ConsultationNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => {
            setIsNoteModalOpen(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          readOnly={true}
        />
      )}
    </Dialog>
  );
}
