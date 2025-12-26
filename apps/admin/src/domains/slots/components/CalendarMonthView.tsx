import { useRef, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import type { DateSelectArg, DayCellContentArg, DayCellMountArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';
import { TimeRangeSummary } from './TimeRangeSummary';
import type { Slot } from '../types';

interface CalendarMonthViewProps {
  slots: Slot[];
  isLoading?: boolean;
  onDateSelect?: (start: Date) => void;
  onDateClick?: (date: Date) => void;
  onNavigationChange?: (date: Date) => void;
  calendarRef?: React.RefObject<FullCalendar | null>;
}

export function CalendarMonthView({
  slots,
  isLoading = false,
  onDateSelect,
  onDateClick,
  onNavigationChange,
  calendarRef: externalRef,
}: CalendarMonthViewProps) {
  const internalRef = useRef<FullCalendar | null>(null);
  const calendarRef = externalRef || internalRef;
  const dayEventRootsRef = useRef<Map<string, Root>>(new Map());

  // 날짜별로 슬롯 그룹화
  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);

  // 슬롯 변경 시 이미 렌더링된 날짜 셀의 시간대 요약 업데이트
  useEffect(() => {
    // dayEventRootsRef에 저장된 모든 날짜 셀 업데이트
    dayEventRootsRef.current.forEach((root, dateKey) => {
      const daySlots = slotsByDate[dateKey] || [];
      // 기존 Root를 사용하여 새로운 데이터로 다시 렌더링
      root.render(<TimeRangeSummary slots={daySlots} />);
    });
  }, [slots, slotsByDate]);

  // 날짜 셀 커스텀 렌더링 (day-top 영역만)
  const renderDayCellContent = (arg: DayCellContentArg) => {
    // 날짜 번호만 반환 (day-top 영역)
    return <div className="fc-daygrid-day-number text-right">{arg.dayNumberText}</div>;
  };

  // dayCellDidMount: day-events 영역에 시간대 요약 추가
  const handleDayCellMount = (arg: DayCellMountArg) => {
    const dateKey = format(arg.date, 'yyyy-MM-dd');
    const dayEventsEl = arg.el.querySelector('.fc-daygrid-day-events') as HTMLElement;

    if (!dayEventsEl) return;

    // 기존에 렌더링된 내용이 있으면 제거
    const existingRoot = dayEventRootsRef.current.get(dateKey);
    if (existingRoot) {
      existingRoot.unmount();
      dayEventRootsRef.current.delete(dateKey);
    }

    // 기존 컨테이너 제거
    const existingContainer = dayEventsEl.querySelector('div');
    if (existingContainer && existingContainer.parentElement === dayEventsEl) {
      dayEventsEl.removeChild(existingContainer);
    }

    // 항상 컨테이너 생성 (슬롯이 없어도 나중에 업데이트할 수 있도록)
    const container = document.createElement('div');
    dayEventsEl.appendChild(container);

    const root = createRoot(container);
    const daySlots = slotsByDate[dateKey] || [];
    root.render(<TimeRangeSummary slots={daySlots} />);
    dayEventRootsRef.current.set(dateKey, root);
  };

  // dayCellWillUnmount: cleanup
  const handleDayCellUnmount = (arg: DayCellMountArg) => {
    const dateKey = format(arg.date, 'yyyy-MM-dd');
    const root = dayEventRootsRef.current.get(dateKey);
    if (root) {
      root.unmount();
      dayEventRootsRef.current.delete(dateKey);
    }
  };

  // 날짜 선택 핸들러 (슬롯 생성)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { start } = selectInfo;

    // 30분 단위로 정렬
    const startMinutes = start.getMinutes();
    const roundedStartMinutes = startMinutes < 30 ? 0 : 30;
    const roundedStart = new Date(start);
    roundedStart.setMinutes(roundedStartMinutes, 0, 0);

    onDateSelect?.(roundedStart);
    selectInfo.view.calendar.unselect();
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (arg: { date: Date }) => {
    onDateClick?.(arg.date);
  };

  return (
    <div className="flex-1">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-text-secondary">로딩 중...</div>
        </div>
      ) : (
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale={koLocale}
          selectable={true}
          selectMirror={true}
          weekends={true}
          select={handleDateSelect}
          dateClick={handleDateClick}
          dayCellContent={renderDayCellContent}
          dayCellDidMount={handleDayCellMount}
          dayCellWillUnmount={handleDayCellUnmount}
          height="auto"
          dayMaxEvents={false}
          moreLinkClick="popover"
          datesSet={arg => {
            onNavigationChange?.(arg.start);
          }}
        />
      )}
    </div>
  );
}
