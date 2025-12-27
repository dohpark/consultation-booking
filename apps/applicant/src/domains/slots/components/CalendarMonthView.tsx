import { useRef, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import type { DayCellContentArg, DayCellMountArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';
import { TimeRangeSummary } from './TimeRangeSummary';
import type { Slot } from '../types';

interface CalendarMonthViewProps {
  slots: Slot[];
  isLoading?: boolean;
  onDateClick?: (date: Date) => void;
  onNavigationChange?: (date: Date) => void;
  calendarRef?: React.RefObject<FullCalendar | null>;
  validRange?: { start: string; end?: string };
}

export function CalendarMonthView({
  slots,
  isLoading = false,
  onDateClick,
  onNavigationChange,
  calendarRef: externalRef,
  validRange,
}: CalendarMonthViewProps) {
  const internalRef = useRef<FullCalendar | null>(null);
  const calendarRef = externalRef || internalRef;
  const dayEventRootsRef = useRef<Map<string, Root>>(new Map());

  // 날짜별로 슬롯 그룹화
  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);

  // 슬롯 변경 시 이미 렌더링된 날짜 셀의 시간대 요약 업데이트
  useEffect(() => {
    if (!calendarRef.current) return;

    // FullCalendar API를 사용하여 현재 보이는 모든 날짜 셀 찾기
    const calendarApi = calendarRef.current.getApi();
    const view = calendarApi.view;
    const start = view.activeStart;
    const end = view.activeEnd;

    // 현재 보이는 날짜 범위의 모든 날짜 셀 업데이트
    const currentDate = new Date(start);
    while (currentDate < end) {
      // 로컬 시간 기준으로 날짜 키 생성 (groupSlotsByDate와 동일한 방식)
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const root = dayEventRootsRef.current.get(dateKey);
      const daySlots = slotsByDate[dateKey] || [];

      if (root) {
        // 이미 마운트된 날짜 셀 업데이트
        root.render(<TimeRangeSummary slots={daySlots} />);
      } else if (daySlots.length > 0) {
        // root가 없지만 슬롯이 있는 경우, FullCalendar의 날짜 셀을 찾아서 직접 업데이트
        // 이는 dayCellDidMount가 아직 실행되지 않았거나, 실행되었지만 root가 저장되지 않은 경우를 처리
        // @ts-expect-error - calendarApi.el은 타입 정의에 없지만 실제로 존재함
        const dayEl = calendarApi.el?.querySelector(`[data-date="${dateKey}"]`) as HTMLElement | null;
        if (dayEl) {
          const dayEventsEl = dayEl.querySelector('.fc-daygrid-day-events') as HTMLElement;
          if (dayEventsEl) {
            // 기존 컨테이너 제거
            const existingContainer = dayEventsEl.querySelector('div');
            if (existingContainer && existingContainer.parentElement === dayEventsEl) {
              dayEventsEl.removeChild(existingContainer);
            }

            // 새 컨테이너 생성
            const container = document.createElement('div');
            dayEventsEl.appendChild(container);

            const newRoot = createRoot(container);
            newRoot.render(<TimeRangeSummary slots={daySlots} />);
            dayEventRootsRef.current.set(dateKey, newRoot);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }, [slotsByDate]);

  // 날짜 셀 커스텀 렌더링 (day-top 영역만)
  const renderDayCellContent = useCallback((arg: DayCellContentArg) => {
    // 날짜 번호만 반환 (day-top 영역)
    return <div className="fc-daygrid-day-number text-right">{arg.dayNumberText}</div>;
  }, []);

  // dayCellDidMount: day-events 영역에 시간대 요약 추가
  const handleDayCellMount = useCallback(
    (arg: DayCellMountArg) => {
      const dateKey = format(arg.date, 'yyyy-MM-dd');
      const dayEventsEl = arg.el.querySelector('.fc-daygrid-day-events') as HTMLElement;
      const daySlots = slotsByDate[dateKey] || [];

      if (!dayEventsEl) return;

      // 기존에 렌더링된 내용이 있으면 제거 (비동기로 처리하여 렌더링 사이클과 충돌 방지)
      const oldRoot = dayEventRootsRef.current.get(dateKey);
      if (oldRoot) {
        // map에서 즉시 제거하여 새 root 추가 가능하도록 함
        dayEventRootsRef.current.delete(dateKey);
        // 다음 이벤트 루프에서 unmount하여 렌더링 사이클과 충돌 방지
        setTimeout(() => {
          oldRoot.unmount();
        }, 0);
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
      root.render(<TimeRangeSummary slots={daySlots} />);
      dayEventRootsRef.current.set(dateKey, root);
    },
    [slotsByDate],
  );

  // dayCellWillUnmount: cleanup
  const handleDayCellUnmount = useCallback((arg: DayCellMountArg) => {
    const dateKey = format(arg.date, 'yyyy-MM-dd');
    const root = dayEventRootsRef.current.get(dateKey);
    if (root) {
      // 다음 이벤트 루프에서 unmount하여 렌더링 사이클과 충돌 방지
      setTimeout(() => {
        root.unmount();
        dayEventRootsRef.current.delete(dateKey);
      }, 0);
    }
  }, []);

  // 날짜 클릭 핸들러
  const handleDateClick = useCallback(
    (arg: { date: Date }) => {
      onDateClick?.(arg.date);
    },
    [onDateClick],
  );

  // datesSet 핸들러
  const handleDatesSet = useCallback(
    (arg: { view: { currentStart: Date } }) => {
      // FullCalendar의 view.currentStart는 해당 월의 첫 번째 날짜를 나타냄
      onNavigationChange?.(arg.view.currentStart);
    },
    [onNavigationChange],
  );

  return (
    <div className="flex-1 relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        locale={koLocale}
        weekends={true}
        dateClick={handleDateClick}
        dayCellContent={renderDayCellContent}
        dayCellDidMount={handleDayCellMount}
        dayCellWillUnmount={handleDayCellUnmount}
        height="auto"
        dayMaxEvents={false}
        moreLinkClick="popover"
        datesSet={handleDatesSet}
        validRange={validRange}
      />
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-text-secondary text-sm">슬롯을 불러오는 중...</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
