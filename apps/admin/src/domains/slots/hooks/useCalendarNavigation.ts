import type { RefObject } from 'react';
import type FullCalendar from '@fullcalendar/react';

export function useCalendarNavigation(calendarRef: RefObject<FullCalendar | null>) {
  const handlePrev = () => {
    const calendar = calendarRef.current?.getApi();
    calendar?.prev();
  };

  const handleNext = () => {
    const calendar = calendarRef.current?.getApi();
    calendar?.next();
  };

  const handleToday = () => {
    const calendar = calendarRef.current?.getApi();
    calendar?.today();
  };

  return {
    handlePrev,
    handleNext,
    handleToday,
  };
}
