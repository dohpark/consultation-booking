import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { useSlots } from '../domains/slots/hooks/useSlots';
import { useCalendarNavigation } from '../domains/slots/hooks/useCalendarNavigation';
import { useCalendarMode } from '../domains/slots/hooks/useCalendarMode';
import { CalendarHeader } from '../domains/slots/components/CalendarHeader';
import { CalendarMonthView } from '../domains/slots/components/CalendarMonthView';
import type { Slot } from '../domains/slots/types';

const Dashboard = () => {
  const { slots, isLoading, addSlot } = useSlots();
  const [currentDate, setCurrentDate] = useState(new Date());
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
    console.log('Date clicked:', date);
    // TODO: 중앙 모달 오픈 (TASK-03에서 구현)
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
          onNavigationChange={setCurrentDate}
        />
      </div>
    </div>
  );
};

export default Dashboard;
