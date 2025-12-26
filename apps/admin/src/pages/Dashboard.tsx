import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { useSlots } from '../domains/slots/hooks/useSlots';
import { useReservations } from '../domains/slots/hooks/useReservations';
import { useCalendarNavigation } from '../domains/slots/hooks/useCalendarNavigation';
import { useCalendarMode } from '../domains/slots/hooks/useCalendarMode';
import { CalendarHeader } from '../domains/slots/components/CalendarHeader';
import { CalendarMonthView } from '../domains/slots/components/CalendarMonthView';
import { DateDetailModal } from '../domains/slots/components/DateDetailModal';
import { DateRangeConfirmModal } from '../domains/slots/components/DateRangeConfirmModal';
import { ReservationView } from '../domains/slots/components/ReservationView';
import { SlotEditView } from '../domains/slots/components/SlotEditView';
import type { Slot } from '../domains/slots/types';

const Dashboard = () => {
  const { slots, isLoading, addSlot, removeSlot } = useSlots();
  const { reservations, cancelReservation, editReservation } = useReservations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { handlePrev, handleNext, handleToday } = useCalendarNavigation(calendarRef);
  const { mode, toggleViewReservations, toggleEditSlots } = useCalendarMode();

  // 날짜 선택 핸들러 (슬롯 생성)
  const handleDateSelect = (start: Date) => {
    const roundedEnd = new Date(start);
    roundedEnd.setMinutes(roundedEnd.getMinutes() + 30);

    // TODO: API 연동 후 활성화
    // 임시: 더미 슬롯 추가 (로컬 상태만 업데이트)
    const newSlot: Slot = {
      id: `temp-${Date.now()}`,
      counselorId: 'temp',
      startAt: start.toISOString(),
      endAt: roundedEnd.toISOString(),
      capacity: 3,
      bookedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSlot(newSlot);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 날짜 범위 선택 핸들러 (드래그 선택)
  const handleDateRangeSelect = (start: Date, end: Date) => {
    setSelectedDateRange({ start, end });
    setIsDateRangeModalOpen(true);
  };

  // 날짜 범위 확인 핸들러
  const handleConfirmDateRange = (startDate: Date, endDate: Date, option: 'exclude' | 'include') => {
    // 날짜 범위를 상태에 저장하고 모달 열기
    // option은 향후 사용 예정 (예약이 있는 날짜 제외/포함 처리)
    void option; // 향후 사용 예정
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

  // 슬롯 변경사항 확인 핸들러 (예약 시간 수정 모드용)
  const handleConfirmSlotChanges = (addedSlots: Array<{ startAt: Date; endAt: Date }>, deletedSlotIds: string[]) => {
    // 추가할 슬롯들 생성
    addedSlots.forEach(({ startAt, endAt }) => {
      const newSlot: Slot = {
        id: `temp-${Date.now()}-${Math.random()}`,
        counselorId: 'temp',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        capacity: 3,
        bookedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addSlot(newSlot);
    });

    // 삭제할 슬롯들 제거
    deletedSlotIds.forEach(slotId => {
      removeSlot(slotId);
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
          slots={slots}
          reservations={reservations}
          onConfirm={handleConfirmDateRange}
        />
      )}
    </div>
  );
};

export default Dashboard;
