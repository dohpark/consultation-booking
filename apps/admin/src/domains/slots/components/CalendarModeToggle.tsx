import type { CalendarMode } from '../types';

interface CalendarModeToggleProps {
  mode: CalendarMode;
  onToggleViewReservations: () => void;
  onToggleEditSlots: () => void;
}

export function CalendarModeToggle({ mode, onToggleViewReservations, onToggleEditSlots }: CalendarModeToggleProps) {
  const isViewReservationsActive = mode === 'viewReservations';
  const isEditSlotsActive = mode === 'editSlots';

  return (
    <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-lg border border-border">
      <button
        onClick={onToggleViewReservations}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          isViewReservationsActive
            ? 'bg-white shadow-sm text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        예약자 확인
      </button>
      <button
        onClick={onToggleEditSlots}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          isEditSlotsActive
            ? 'bg-white shadow-sm text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        예약 시간 수정
      </button>
    </div>
  );
}

