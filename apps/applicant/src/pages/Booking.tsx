import { useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type FullCalendar from '@fullcalendar/react';
import { useSlotsByMonth } from '../domains/slots/hooks/useSlotsByMonth';
import { CalendarHeader } from '../domains/slots/components/CalendarHeader';
import { CalendarMonthView } from '../domains/slots/components/CalendarMonthView';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // 오늘 날짜 및 유효 범위 메모이제이션 (무한 루프 방지 핵심)
  const validRange = useMemo(
    () => ({
      start: format(new Date(), 'yyyy-MM-dd'),
    }),
    [],
  );

  // 현재 월의 모든 슬롯 조회
  const { data: monthSlots, isLoading: isLoadingMonth } = useSlotsByMonth(currentDate, token);

  // 선택된 날짜의 슬롯 필터링
  const selectedSlots = useMemo(() => {
    if (!selectedDate || !monthSlots) return [];
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return monthSlots.filter(slot => {
      const slotDateStr = format(parseISO(slot.startAt), 'yyyy-MM-dd');
      return slotDateStr === selectedDateStr;
    });
  }, [selectedDate, monthSlots]);

  // 캘린더 네비게이션 핸들러
  const handlePrev = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  }, []);

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  }, []);

  // 날짜 클릭 핸들러
  const handleDateClick = useCallback((date: Date) => {
    const clickedDate = date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 이후 날짜만 선택 가능
    if (clickedDate < today) {
      return;
    }

    setSelectedDate(clickedDate);
  }, []);

  // 네비게이션 변경 핸들러
  const handleNavigationChange = useCallback((date: Date) => {
    // 월이 실제로 바뀐 경우에만 상태 업데이트
    setCurrentDate(prev => {
      if (prev.getMonth() === date.getMonth() && prev.getFullYear() === date.getFullYear()) {
        return prev;
      }
      return date;
    });
  }, []);

  // 슬롯을 시간순으로 정렬
  const sortedSlots = useMemo(() => {
    if (!selectedSlots) return [];
    return [...selectedSlots].sort((a, b) => {
      const timeA = parseISO(a.startAt).getTime();
      const timeB = parseISO(b.startAt).getTime();
      return timeA - timeB;
    });
  }, [selectedSlots]);

  const formatTime = useCallback((dateString: string) => {
    return format(parseISO(dateString), 'HH:mm', { locale: ko });
  }, []);

  const formatDate = useCallback((date: Date) => {
    return format(date, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
  }, []);

  return (
    <div className="min-h-screen bg-bg-secondary px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="card">
          <h1 className="text-3xl font-bold text-text-primary mb-6">상담 예약</h1>

          {/* 캘린더 헤더 */}
          <CalendarHeader currentDate={currentDate} onPrev={handlePrev} onNext={handleNext} onToday={handleToday} />

          {/* 캘린더 */}
          <CalendarMonthView
            slots={monthSlots || []}
            isLoading={isLoadingMonth}
            onDateClick={handleDateClick}
            onNavigationChange={handleNavigationChange}
            calendarRef={calendarRef}
            validRange={validRange}
          />
        </div>
        선택된 날짜의 슬롯 리스트
        {selectedDate && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">{formatDate(selectedDate)} 예약 가능 시간</h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                닫기
              </button>
            </div>

            {isLoadingMonth && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-text-secondary">슬롯을 불러오는 중...</span>
              </div>
            )}

            {!isLoadingMonth && sortedSlots.length === 0 && (
              <div className="bg-bg-tertiary rounded-lg p-6 text-center">
                <p className="text-text-secondary">예약 가능한 슬롯이 없습니다.</p>
              </div>
            )}

            {!isLoadingMonth && sortedSlots.length > 0 && (
              <div className="grid gap-3">
                {sortedSlots.map(slot => {
                  const isDisabled = slot.availableCount === 0;
                  const startTime = formatTime(slot.startAt);
                  const endTime = formatTime(slot.endAt);

                  return (
                    <button
                      key={slot.id}
                      disabled={isDisabled}
                      className={`
                        w-full p-4 rounded-lg border text-left transition-all
                        ${
                          isDisabled
                            ? 'bg-bg-tertiary border-border opacity-60 cursor-not-allowed'
                            : 'bg-bg-primary border-border hover:border-primary hover:bg-primary-light/10 cursor-pointer'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-text-primary">
                              {startTime} - {endTime}
                            </span>
                            {isDisabled && (
                              <span className="px-2 py-1 text-xs font-medium bg-error/20 text-error rounded">마감</span>
                            )}
                          </div>
                          <div className="text-sm text-text-secondary">
                            잔여 자리: <span className="font-medium">{slot.availableCount}</span> /{' '}
                            <span className="font-medium">{slot.capacity}</span>
                          </div>
                        </div>
                        {!isDisabled && (
                          <div className="ml-4">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {!selectedDate && (
          <div className="card bg-bg-tertiary">
            <p className="text-center text-text-secondary py-8">
              캘린더에서 날짜를 선택하면 예약 가능한 시간을 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
