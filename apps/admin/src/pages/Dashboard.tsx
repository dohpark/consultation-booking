import { useRef, useState } from 'react';
import type FullCalendar from '@fullcalendar/react';
import { useSlotsQuery } from '../domains/slots/hooks/useSlotsQuery';
import { useCreateSlot, useDeleteSlot } from '../domains/slots/hooks/useSlotMutations';
import { useReservations } from '../domains/slots/hooks/useReservations';
import { useCalendarNavigation } from '../domains/slots/hooks/useCalendarNavigation';
import { useCalendarMode } from '../domains/slots/hooks/useCalendarMode';
import { useToast } from '../shared/contexts/ToastContext';
import { CalendarHeader } from '../domains/slots/components/CalendarHeader';
import { CalendarMonthView } from '../domains/slots/components/CalendarMonthView';
import { DateDetailModal } from '../domains/slots/components/DateDetailModal';
import { DateRangeConfirmModal } from '../domains/slots/components/DateRangeConfirmModal';
import { ReservationBlockedModal } from '../domains/slots/components/ReservationBlockedModal';
import { ReservationView } from '../domains/slots/components/ReservationView';
import { SlotEditView } from '../domains/slots/components/SlotEditView';
import { ClientHistoryModal } from '../domains/slots/components/ClientHistoryModal';
import { eachDayOfInterval, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import type { Slot } from '../domains/slots/types';

const Dashboard = () => {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { slots, isLoading, refreshSlots } = useSlotsQuery(currentDate);
  const createSlotMutation = useCreateSlot();
  const deleteSlotMutation = useDeleteSlot();
  const { reservations, cancelReservation, editReservation } = useReservations({ slots });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isReservationBlockedModalOpen, setIsReservationBlockedModalOpen] = useState(false);
  const [pendingFilteredDateRange, setPendingFilteredDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [excludedDates, setExcludedDates] = useState<Date[]>([]);
  const [isClientHistoryModalOpen, setIsClientHistoryModalOpen] = useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const calendarRef = useRef<FullCalendar>(null);
  const { handlePrev, handleNext, handleToday } = useCalendarNavigation(calendarRef);
  const { mode, toggleViewReservations, toggleEditSlots } = useCalendarMode();

  // 날짜 선택 핸들러 (슬롯 생성)
  const handleDateSelect = (start: Date) => {
    const roundedEnd = new Date(start);
    roundedEnd.setMinutes(roundedEnd.getMinutes() + 30);

    createSlotMutation.mutate(
      {
        startAt: start.toISOString(),
        endAt: roundedEnd.toISOString(),
        capacity: 3,
      },
      {
        onSuccess: () => {
          showToast('슬롯이 생성되었습니다.', 'success');
          refreshSlots();
        },
        onError: error => {
          const errorMessage = error instanceof Error ? error.message : '슬롯 생성에 실패했습니다.';
          showToast(errorMessage, 'error');
        },
      },
    );
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 날짜 범위 선택 핸들러 (드래그 선택)
  const handleDateRangeSelect = (start: Date, end: Date) => {
    // 날짜 범위의 모든 날짜 생성 (시작일과 종료일 포함)
    const startDay = startOfDay(start);
    const endDay = endOfDay(end);
    const dates = eachDayOfInterval({ start: startDay, end: endDay });

    // 예약이 있는 날짜와 없는 날짜 필터링
    const editableDates: Date[] = [];
    const blockedDates: Date[] = [];

    dates.forEach(date => {
      const hasReservations = dateHasReservations(date);
      if (hasReservations) {
        blockedDates.push(date);
      } else {
        editableDates.push(date);
      }
    });

    // 예약이 있는 날짜가 포함된 경우 안내 모달 표시
    if (blockedDates.length > 0) {
      setExcludedDates(blockedDates);
      setIsReservationBlockedModalOpen(true);
    }

    // 예약 없는 날짜가 1개라도 있으면 일괄 적용 진행
    if (editableDates.length > 0) {
      const filteredStart = editableDates[0];
      const filteredEnd = editableDates[editableDates.length - 1];
      setSelectedDateRange({ start: filteredStart, end: filteredEnd });
      // 안내 모달이 표시된 경우, 모달 확인 후 편집 모달 열기
      if (blockedDates.length > 0) {
        setPendingFilteredDateRange({ start: filteredStart, end: filteredEnd });
      } else {
        // 예약 없는 날짜만 있는 경우 바로 편집 모달 열기
        setIsDateRangeModalOpen(true);
      }
    } else {
      // 드래그 범위가 전부 예약 있는 날짜인 경우 일괄 적용 안 함
      setSelectedDateRange(null);
      setPendingFilteredDateRange(null);
    }
  };

  // 날짜 범위 확인 핸들러
  const handleConfirmDateRange = (startDate: Date, endDate: Date) => {
    // 날짜 범위를 상태에 저장하고 모달 열기
    setSelectedDateRange({ start: startDate, end: endDate });
    setSelectedDate(startDate);
    setIsDateRangeModalOpen(false);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러 (취소 동작)
  const handleCloseModal = () => {
    // 모달 닫기 시 임시 변경사항은 자동으로 취소됨 (SlotEditView의 cleanup)
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedDateRange(null);
  };

  // 클라이언트 내역 조회 핸들러
  const handleViewClientHistory = (email: string, name: string) => {
    setSelectedClientEmail(email);
    setSelectedClientName(name);
    setIsClientHistoryModalOpen(true);
  };

  // 슬롯에 예약이 있는지 확인
  const hasReservations = (slot: Slot): boolean => {
    return reservations.some(reservation => reservation.slotId === slot.id && reservation.status === 'BOOKED');
  };

  // 날짜에 예약이 있는지 확인
  const dateHasReservations = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');

    // 해당 날짜의 슬롯 찾기
    const dateSlots = slots.filter(slot => {
      const slotDate = format(parseISO(slot.startAt), 'yyyy-MM-dd');
      return slotDate === dateKey;
    });

    // 해당 날짜의 슬롯 중 예약이 있는 슬롯이 있는지 확인
    return dateSlots.some(slot => hasReservations(slot));
  };

  // 슬롯 변경사항 확인 핸들러 (예약 시간 수정 모드용)
  const handleConfirmSlotChanges = async (
    addedSlots: Array<{ startAt: Date; endAt: Date }>,
    deletedSlotIds: string[],
  ) => {
    // 변경사항이 없으면 모달만 닫기
    if (addedSlots.length === 0 && deletedSlotIds.length === 0) {
      handleCloseModal();
      return;
    }

    // 추가할 슬롯들 생성 (API 호출)
    const addedSuccess: Array<{ startAt: Date; endAt: Date }> = [];
    const addedFailures: Array<{ startAt: Date; endAt: Date; error: string }> = [];

    for (const slot of addedSlots) {
      try {
        await createSlotMutation.mutateAsync({
          startAt: slot.startAt.toISOString(),
          endAt: slot.endAt.toISOString(),
          capacity: 3,
        });
        addedSuccess.push(slot);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '슬롯 생성에 실패했습니다.';
        addedFailures.push({ ...slot, error: errorMessage });
      }
    }

    // 추가 결과 토스트 표시
    if (addedSuccess.length > 0) {
      showToast(`${addedSuccess.length}개의 슬롯이 생성되었습니다.`, 'success');
    }
    if (addedFailures.length > 0) {
      showToast(`${addedFailures.length}개의 슬롯 생성에 실패했습니다.`, 'error');
    }

    // 삭제할 슬롯들 제거 (API 호출)
    // 예약이 있는 슬롯은 삭제하지 않음 (이미 필터링됨)
    const validDeletedSlotIds = deletedSlotIds.filter(slotId => {
      const slot = slots.find(s => s.id === slotId);
      return slot && !hasReservations(slot);
    });

    const deletedSuccess: string[] = [];
    const deletedFailures: Array<{ slotId: string; error: string }> = [];

    for (const slotId of validDeletedSlotIds) {
      try {
        await deleteSlotMutation.mutateAsync(slotId);
        deletedSuccess.push(slotId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '슬롯 삭제에 실패했습니다.';
        deletedFailures.push({ slotId, error: errorMessage });
      }
    }

    // 삭제 결과 토스트 표시
    if (deletedSuccess.length > 0) {
      showToast(`${deletedSuccess.length}개의 슬롯이 삭제되었습니다.`, 'success');
    }
    if (deletedFailures.length > 0) {
      showToast(`${deletedFailures.length}개의 슬롯 삭제에 실패했습니다.`, 'error');
    }

    // 전체 실패 시 모달 닫지 않음
    if (addedFailures.length > 0 || deletedFailures.length > 0) {
      // 부분 실패는 모달을 닫지만, 사용자에게 알림은 이미 표시됨
      // 모든 작업이 실패한 경우에만 모달을 유지
      if (addedSuccess.length === 0 && deletedSuccess.length === 0) {
        return; // 모든 작업 실패 시 모달 닫지 않음
      }
    }

    // 성공한 작업이 있으면 슬롯 목록 갱신
    if (addedSuccess.length > 0 || deletedSuccess.length > 0) {
      refreshSlots();
    }

    // 모달 닫기
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">상담 일정 관리</h1>
          <p className="text-text-secondary text-sm">슬롯을 추가하거나 예약을 관리하세요</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card min-h-[600px] flex flex-col">
        <CalendarHeader
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          mode={mode}
          onToggleViewReservations={toggleViewReservations}
          onToggleEditSlots={toggleEditSlots}
        />
        <CalendarMonthView
          calendarRef={calendarRef}
          slots={slots}
          isLoading={isLoading}
          mode={mode}
          onDateSelect={handleDateSelect}
          onDateClick={handleDateClick}
          onDateRangeSelect={handleDateRangeSelect}
          onNavigationChange={setCurrentDate}
        />
      </div>

      {/* Date Detail Modal */}
      <DateDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        selectedDateRange={selectedDateRange}
      >
        {mode === 'viewReservations' && selectedDate ? (
          <ReservationView
            selectedDate={selectedDate}
            slots={slots}
            reservations={reservations}
            onCancelReservation={cancelReservation}
            onEditReservation={editReservation}
            onViewClientHistory={handleViewClientHistory}
          />
        ) : mode === 'editSlots' && selectedDate ? (
          <SlotEditView
            key={`${selectedDate.toISOString()}-${selectedDateRange ? `${selectedDateRange.start.toISOString()}-${selectedDateRange.end.toISOString()}` : 'single'}`}
            selectedDate={selectedDate}
            selectedDateRange={selectedDateRange || undefined}
            slots={slots}
            reservations={reservations}
            onConfirm={handleConfirmSlotChanges}
            onCancel={handleCloseModal}
          />
        ) : null}
      </DateDetailModal>

      {/* Date Range Confirm Modal */}
      {selectedDateRange && (
        <DateRangeConfirmModal
          isOpen={isDateRangeModalOpen}
          onClose={() => {
            setIsDateRangeModalOpen(false);
            setSelectedDateRange(null);
          }}
          startDate={selectedDateRange.start}
          endDate={selectedDateRange.end}
          onConfirm={handleConfirmDateRange}
        />
      )}

      {/* Client History Modal */}
      <ClientHistoryModal
        isOpen={isClientHistoryModalOpen}
        onClose={() => setIsClientHistoryModalOpen(false)}
        clientEmail={selectedClientEmail}
        clientName={selectedClientName}
      />

      {/* Reservation Blocked Modal */}
      <ReservationBlockedModal
        isOpen={isReservationBlockedModalOpen}
        excludedDates={excludedDates}
        onClose={() => {
          setIsReservationBlockedModalOpen(false);
          setExcludedDates([]);
          // 안내 모달 닫은 후, 필터링된 날짜 범위가 있으면 편집 모달 열기
          if (pendingFilteredDateRange) {
            setSelectedDateRange(pendingFilteredDateRange);
            setSelectedDate(pendingFilteredDateRange.start);
            setIsModalOpen(true);
            setPendingFilteredDateRange(null);
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
