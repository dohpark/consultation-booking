import { format, parseISO } from 'date-fns';
import type { Slot } from '../types';

/**
 * 슬롯 배열을 날짜별로 그룹화
 * @param slots 슬롯 배열
 * @returns 날짜별로 그룹화된 슬롯 객체 (키: "yyyy-MM-dd")
 */
export function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const grouped: Record<string, Slot[]> = {};
  slots.forEach(slot => {
    const dateKey = format(parseISO(slot.startAt), 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(slot);
  });
  return grouped;
}

