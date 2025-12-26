import { mergeTimeRanges } from '../utils/mergeTimeRanges';
import type { Slot } from '../types';

interface TimeRangeSummaryProps {
  slots: Slot[];
}

export function TimeRangeSummary({ slots }: TimeRangeSummaryProps) {
  const timeRanges = mergeTimeRanges(slots);

  // 최대 3줄까지 표시, 초과 시 +N
  const maxLines = 3;
  const displayRanges = timeRanges.slice(0, maxLines);
  const remainingCount = timeRanges.length - maxLines;

  if (slots.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {displayRanges.map((range, idx) => (
        <div key={idx} className="text-xs text-text-secondary px-1 py-0.5 bg-primary-light rounded">
          {range}
        </div>
      ))}
      {remainingCount > 0 && <div className="text-xs text-text-tertiary px-1">+{remainingCount}</div>}
    </div>
  );
}

