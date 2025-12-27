import { Dialog } from '@headlessui/react';
import { X, Save } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { useConsultationNote, useUpsertConsultationNote } from '../hooks/useConsultationNote';
import { useToast } from '../../../shared/contexts/ToastContext';
import type { Reservation } from '../types';

interface ConsultationNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
}

const STORAGE_KEY_PREFIX = 'consultation_note_draft_';

export function ConsultationNoteModal({ isOpen, onClose, reservation }: ConsultationNoteModalProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${reservation.id}`;
  const { data: note, isLoading, isError, error } = useConsultationNote(reservation.id, isOpen);
  const upsertMutation = useUpsertConsultationNote();

  // 초기 상태 결정: 서버 노트 > localStorage draft > 빈 문자열
  const getInitialContent = () => {
    if (note) {
      localStorage.removeItem(storageKey);
      return { content: note.content, hasUnsavedChanges: false };
    }
    const draft = localStorage.getItem(storageKey);
    if (draft !== null) {
      return { content: draft, hasUnsavedChanges: true };
    }
    return { content: '', hasUnsavedChanges: false };
  };

  const [content, setContent] = useState(() => {
    if (!isOpen) return '';
    return getInitialContent().content;
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(() => {
    if (!isOpen) return false;
    return getInitialContent().hasUnsavedChanges;
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  // 예약이 변경되거나 노트가 로드되면 상태 업데이트
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const initial = getInitialContent();
    setContent(initial.content);
    setHasUnsavedChanges(initial.hasUnsavedChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation.id, note, isOpen, isLoading]);

  // localStorage에 임시 저장 (debounce)
  useEffect(() => {
    if (!isOpen || !reservation.id) return;

    const timer = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem(storageKey, content);
      } else {
        localStorage.removeItem(storageKey);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [content, isOpen, reservation.id, storageKey]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('내용을 입력해주세요.', 'error');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        reservationId: reservation.id,
        dto: { content: content.trim() },
      });

      // 저장 성공 시 localStorage에서 임시 저장본 제거
      localStorage.removeItem(storageKey);
      setHasUnsavedChanges(false);
      showToast('상담 노트가 저장되었습니다.', 'success');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '상담 노트 저장에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      // 변경사항이 있으면 확인 후 닫기
      const confirmed = window.confirm('저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?');
      if (!confirmed) {
        return;
      }
    }
    onClose();
  };

  const isLoadingState = isLoading || upsertMutation.isPending;
  const isErrorState = isError || upsertMutation.isError;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-border max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <Dialog.Title className="text-xl font-bold text-text-primary">상담 노트 작성</Dialog.Title>
              <p className="text-sm text-text-secondary mt-1">
                {reservation.name} ({reservation.email})
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="닫기"
              disabled={isLoadingState}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="space-y-4">
                <div className="h-4 bg-bg-tertiary rounded w-1/3 animate-pulse"></div>
                <div className="h-32 bg-bg-tertiary rounded animate-pulse"></div>
              </div>
            )}

            {isErrorState && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
                <p className="text-sm text-error">
                  {error instanceof Error
                    ? error.message
                    : upsertMutation.error instanceof Error
                      ? upsertMutation.error.message
                      : '상담 노트를 불러오는 중 오류가 발생했습니다.'}
                </p>
              </div>
            )}

            {!isLoading && !isErrorState && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="note-content" className="block text-sm font-medium text-text-primary mb-2">
                    상담 내용
                  </label>
                  <TextareaAutosize
                    id="note-content"
                    ref={textareaRef}
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    placeholder="상담 내용을 입력해주세요..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-bg-primary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    minRows={10}
                    maxRows={20}
                    disabled={isLoadingState}
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    {content.length}자 / 최대 10,000자
                    {hasUnsavedChanges && <span className="text-warning ml-2">(저장되지 않음)</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              disabled={isLoadingState}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoadingState || !content.trim()}
              className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingState ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
