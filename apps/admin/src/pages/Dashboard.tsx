import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { useSlots } from '../domains/slots/hooks/useSlots';
import { useReservations } from '../domains/slots/hooks/useReservations';
import { useCalendarNavigation } from '../domains/slots/hooks/useCalendarNavigation';
import { useCalendarMode } from '../domains/slots/hooks/useCalendarMode';
import { useToast } from '../shared/contexts/ToastContext';
import { createSlot } from '../domains/slots/services/slotsService';
import { CalendarHeader } from '../domains/slots/components/CalendarHeader';
import { CalendarMonthView } from '../domains/slots/components/CalendarMonthView';
import { DateDetailModal } from '../domains/slots/components/DateDetailModal';
import { DateRangeConfirmModal } from '../domains/slots/components/DateRangeConfirmModal';
import { ReservationBlockedModal } from '../domains/slots/components/ReservationBlockedModal';
import { ReservationView } from '../domains/slots/components/ReservationView';
import { SlotEditView } from '../domains/slots/components/SlotEditView';
import { eachDayOfInterval, startOfDay, endOfDay, format, parseISO } from 'date-fns';
import type { Slot } from '../domains/slots/types';

const Dashboard = () => {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { slots, isLoading, addSlot, removeSlot, refreshSlots } = useSlots(currentDate);
  const { reservations, cancelReservation, editReservation } = useReservations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isReservationBlockedModalOpen, setIsReservationBlockedModalOpen] = useState(false);
  const [pendingFilteredDateRange, setPendingFilteredDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [excludedDates, setExcludedDates] = useState<Date[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { handlePrev, handleNext, handleToday } = useCalendarNavigation(calendarRef);
  const { mode, toggleViewReservations, toggleEditSlots } = useCalendarMode();

  // 날짜 선택 핸들러 (슬롯 생성)
  const handleDateSelect = async (start: Date) => {
    const roundedEnd = new Date(start);
    roundedEnd.setMinutes(roundedEnd.getMinutes() + 30);

    try {
      const newSlot = await createSlot({
        startAt: start.toISOString(),
        endAt: roundedEnd.toISOString(),
        capacity: 3,
      });
      addSlot(newSlot);
      showToast('슬롯이 생성되었습니다.', 'success');
      // 슬롯 목록 갱신 (현재 월의 슬롯 다시 불러오기)
      refreshSlots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '슬롯 생성에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
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
    // 날짜 범위가 있는 경우, 예약 없는 슬롯만 삭제 대상에 추가 (덮어쓰기 방식)
    if (selectedDateRange) {
      const { start, end } = selectedDateRange;
      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(23, 59, 59, 999);

      // 날짜 범위 내의 모든 슬롯 찾기
      const rangeSlots = slots.filter(slot => {
        const slotDate = new Date(slot.startAt);
        return slotDate >= startDay && slotDate <= endDay;
      });

      // 예약이 없는 슬롯만 삭제 대상에 추가 (이미 deletedSlotIds에 포함된 것은 제외)
      rangeSlots.forEach(slot => {
        if (!hasReservations(slot) && !deletedSlotIds.includes(slot.id)) {
          deletedSlotIds.push(slot.id);
        }
      });
    }

    // 추가할 슬롯들 생성 (API 호출)
    try {
      for (const { startAt, endAt } of addedSlots) {
        const newSlot = await createSlot({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          capacity: 3,
        });
        addSlot(newSlot);
      }
      if (addedSlots.length > 0) {
        showToast(`${addedSlots.length}개의 슬롯이 생성되었습니다.`, 'success');
        // 슬롯 목록 갱신 (현재 월의 슬롯 다시 불러오기)
        refreshSlots();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '슬롯 생성에 실패했습니다.';
      showToast(errorMessage, 'error');
      return; // 에러 발생 시 모달 닫지 않음
    }

    // 삭제할 슬롯들 제거 (예약이 있는 슬롯은 보호)
    // 삭제 기능은 아직 구현하지 않음
    deletedSlotIds.forEach(slotId => {
      const slot = slots.find(s => s.id === slotId);
      if (slot && !hasReservations(slot)) {
        removeSlot(slotId);
      }
    });

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
        <button className="btn-primary flex items-center justify-center gap-2">
          <Plus size={20} />
          <span>새 슬롯 추가</span>
        </button>
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
