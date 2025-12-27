import { useRef, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import type { DateSelectArg, DayCellContentArg, DayCellMountArg } from '@fullcalendar/core';
import { format, isSameDay } from 'date-fns';
import { groupSlotsByDate } from '../utils/groupSlotsByDate';
import { TimeRangeSummary } from './TimeRangeSummary';
import type { Slot, CalendarMode } from '../types';

interface CalendarMonthViewProps {
  slots: Slot[];
  isLoading?: boolean;
  mode?: CalendarMode;
  onDateSelect?: (start: Date) => void;
  onDateClick?: (date: Date) => void;
  onDateRangeSelect?: (start: Date, end: Date) => void;
  onNavigationChange?: (date: Date) => void;
  calendarRef?: React.RefObject<FullCalendar | null>;
}

export function CalendarMonthView({
  slots,
  isLoading = false,
  mode = 'viewReservations',
  onDateSelect,
  onDateClick,
  onDateRangeSelect,
  onNavigationChange,
  calendarRef: externalRef,
}: CalendarMonthViewProps) {
  const internalRef = useRef<FullCalendar | null>(null);
  const calendarRef = externalRef || internalRef;
  const dayEventRootsRef = useRef<Map<string, Root>>(new Map());

  // 예약 시간 수정 모드에서만 드래그 가능
  const isEditSlotsMode = mode === 'editSlots';

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
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const root = dayEventRootsRef.current.get(dateKey);
      
      if (root) {
        // 이미 마운트된 날짜 셀 업데이트
        const daySlots = slotsByDate[dateKey] || [];
        root.render(<TimeRangeSummary slots={daySlots} />);
      } else {
        // 아직 마운트되지 않은 날짜 셀은 DOM에서 찾아서 업데이트
        const dayEl = calendarApi.el.querySelector(`[data-date="${dateKey}"]`) as HTMLElement;
        if (dayEl) {
          const dayEventsEl = dayEl.querySelector('.fc-daygrid-day-events') as HTMLElement;
          if (dayEventsEl) {
            // 기존 컨테이너 제거
            const existingContainer = dayEventsEl.querySelector('div');
            if (existingContainer && existingContainer.parentElement === dayEventsEl) {
              dayEventsEl.removeChild(existingContainer);
            }

            // 새 컨테이너 생성 및 렌더링
            const container = document.createElement('div');
            dayEventsEl.appendChild(container);
            const root = createRoot(container);
            const daySlots = slotsByDate[dateKey] || [];
            root.render(<TimeRangeSummary slots={daySlots} />);
            dayEventRootsRef.current.set(dateKey, root);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }, [slotsByDate, calendarRef]);

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
      const daySlots = slotsByDate[dateKey] || [];
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

  // 날짜 선택 핸들러 (드래그 범위 선택 또는 단일 날짜 선택)
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      const { start, end } = selectInfo;

      if (isEditSlotsMode && onDateRangeSelect) {
        // 예약 시간 수정 모드: 날짜 범위 선택
        // end는 exclusive이므로 하루 전날로 조정
        const endDate = new Date(end);
        endDate.setDate(endDate.getDate() - 1);

        // 단일 날짜 클릭인지 확인 (시작 날짜와 종료 날짜가 같은 날인지)
        if (isSameDay(start, endDate)) {
          // 단일 날짜 클릭은 dateClick 핸들러가 처리하도록 무시
          selectInfo.view.calendar.unselect();
          return;
        }

        // 실제 드래그 선택인 경우에만 날짜 범위 선택 처리
        onDateRangeSelect(start, endDate);
        selectInfo.view.calendar.unselect();
      } else if (onDateSelect) {
        // 기존 동작: 단일 날짜 선택 (30분 단위로 정렬)
        const startMinutes = start.getMinutes();
        const roundedStartMinutes = startMinutes < 30 ? 0 : 30;
        const roundedStart = new Date(start);
        roundedStart.setMinutes(roundedStartMinutes, 0, 0);
        onDateSelect(roundedStart);
        selectInfo.view.calendar.unselect();
      }
    },
    [isEditSlotsMode, onDateSelect, onDateRangeSelect],
  );

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
      // arg.start는 달력이 보여주는 첫 번째 날짜(이전 달 일부 포함 가능)이므로
      // view.currentStart를 사용하여 정확한 월을 가져옴
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
        selectable={isEditSlotsMode} // 예약 시간 수정 모드에서만 드래그 가능
        selectMirror={isEditSlotsMode} // 드래그 시 하이라이트 표시
        weekends={true}
        select={handleDateSelect}
        dateClick={handleDateClick}
        dayCellContent={renderDayCellContent}
        dayCellDidMount={handleDayCellMount}
        dayCellWillUnmount={handleDayCellUnmount}
        height="auto"
        dayMaxEvents={false}
        moreLinkClick="popover"
        datesSet={handleDatesSet}
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
