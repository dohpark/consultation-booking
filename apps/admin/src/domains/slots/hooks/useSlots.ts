import { useState, useEffect, useCallback } from 'react';
import { fetchSlots } from '../services/slotsService';
import type { Slot } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function useSlots(currentDate?: Date) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태를 true로 설정
  const [error, setError] = useState<Error | null>(null);

  const loadSlots = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const from = format(monthStart, 'yyyy-MM-dd');
      const to = format(monthEnd, 'yyyy-MM-dd');

      const fetchedSlots = await fetchSlots({ from, to });
      setSlots(fetchedSlots);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('슬롯 조회에 실패했습니다.');
      setError(error);
      console.error('슬롯 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentDate) {
      loadSlots(currentDate);
    } else {
      // currentDate가 없으면 로딩 상태 해제
      setIsLoading(false);
    }
  }, [currentDate, loadSlots]);

  const addSlot = (slot: Slot) => {
    setSlots(prev => [...prev, slot]);
  };

  const updateSlot = (id: string, updates: Partial<Slot>) => {
    setSlots(prev => prev.map(slot => (slot.id === id ? { ...slot, ...updates } : slot)));
  };

  const removeSlot = (id: string) => {
    setSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const refreshSlots = useCallback(() => {
    if (currentDate) {
      loadSlots(currentDate);
    }
  }, [currentDate, loadSlots]);

  return {
    slots,
    isLoading,
    error,
    addSlot,
    updateSlot,
    removeSlot,
    refreshSlots,
    setSlots,
  };
}
