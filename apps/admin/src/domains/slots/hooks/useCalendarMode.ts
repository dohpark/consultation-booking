import { useState, useCallback } from 'react';
import type { CalendarMode } from '../types';

export function useCalendarMode() {
  const [mode, setMode] = useState<CalendarMode>('viewReservations');

  const setViewReservationsMode = useCallback(() => {
    setMode('viewReservations');
  }, []);

  const setEditSlotsMode = useCallback(() => {
    setMode('editSlots');
  }, []);

  const toggleViewReservations = useCallback(() => {
    setMode('viewReservations');
  }, []);

  const toggleEditSlots = useCallback(() => {
    setMode('editSlots');
  }, []);

  return {
    mode,
    setMode,
    setViewReservationsMode,
    setEditSlotsMode,
    toggleViewReservations,
    toggleEditSlots,
    isViewReservationsMode: mode === 'viewReservations',
    isEditSlotsMode: mode === 'editSlots',
  };
}

