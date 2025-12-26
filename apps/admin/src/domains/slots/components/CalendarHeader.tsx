import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({ currentDate, onPrev, onNext, onToday }: CalendarHeaderProps) {
  const dateTitle = format(currentDate, 'yyyy년 M월', { locale: ko });

  return (
    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-text-primary">{dateTitle}</h2>
        <div className="flex items-center bg-bg-secondary rounded-lg border border-border overflow-hidden">
          <button
            onClick={onPrev}
            className="p-2 hover:bg-bg-tertiary transition-colors border-r border-border"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-medium hover:bg-bg-tertiary transition-colors border-r border-border"
          >
            오늘
          </button>
          <button onClick={onNext} className="p-2 hover:bg-bg-tertiary transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

