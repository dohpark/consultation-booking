import { format, parseISO } from 'date-fns';
import type { Slot } from '../types';

/**
 * 슬롯 배열을 연속된 시간대 범위로 병합
 * @param slots 슬롯 배열
 * @returns 병합된 시간대 문자열 배열 (예: ["10:00 ~ 11:00", "14:00 ~ 16:00"])
 */
export function mergeTimeRanges(slots: Slot[]): string[] {
  if (slots.length === 0) return [];

  // 시간순으로 정렬
  const sorted = [...slots].sort((a, b) => {
    const startA = parseISO(a.startAt);
    const startB = parseISO(b.startAt);
    return startA.getTime() - startB.getTime();
  });

  const ranges: Array<{ start: Date; end: Date }> = [];

  sorted.forEach(slot => {
    const start = parseISO(slot.startAt);
    const end = parseISO(slot.endAt);

    // 기존 범위와 연속되는지 확인
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && lastRange.end.getTime() === start.getTime()) {
      // 연속되면 마지막 범위 확장
      lastRange.end = end;
    } else {
      // 새로운 범위 추가
      ranges.push({ start, end });
    }
  });

  // 시간대 문자열로 변환 (HH:mm ~ HH:mm)
  return ranges.map(range => {
    const startStr = format(range.start, 'HH:mm');
    const endStr = format(range.end, 'HH:mm');
    return `${startStr} ~ ${endStr}`;
  });
}

