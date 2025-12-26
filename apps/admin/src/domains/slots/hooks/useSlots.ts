import { useState } from 'react';
import type { Slot } from '../types';

// 테스트용 더미 슬롯 데이터 (예약이 있는 슬롯 포함)
const generateDummySlots = (): Slot[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots: Slot[] = [];

  // 오늘 날짜의 슬롯들 (예약이 있는 슬롯 포함)
  const todayStr = today.toISOString().split('T')[0];

  // 10:00 슬롯 (예약 2명)
  slots.push({
    id: `slot-${todayStr}-10-0`,
    counselorId: 'test-counselor',
    startAt: `${todayStr}T10:00:00`,
    endAt: `${todayStr}T10:30:00`,
    capacity: 3,
    bookedCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 10:30 슬롯 (예약 1명)
  slots.push({
    id: `slot-${todayStr}-10-30`,
    counselorId: 'test-counselor',
    startAt: `${todayStr}T10:30:00`,
    endAt: `${todayStr}T11:00:00`,
    capacity: 3,
    bookedCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 15:00 슬롯 (예약 3명 - 만석)
  slots.push({
    id: `slot-${todayStr}-15-0`,
    counselorId: 'test-counselor',
    startAt: `${todayStr}T15:00:00`,
    endAt: `${todayStr}T15:30:00`,
    capacity: 3,
    bookedCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 내일 날짜의 슬롯들
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 14:00 슬롯 (예약 2명)
  slots.push({
    id: `slot-${tomorrowStr}-14-0`,
    counselorId: 'test-counselor',
    startAt: `${tomorrowStr}T14:00:00`,
    endAt: `${tomorrowStr}T14:30:00`,
    capacity: 3,
    bookedCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 모레 날짜의 슬롯들
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  // 16:00 슬롯 (예약 1명)
  slots.push({
    id: `slot-${dayAfterTomorrowStr}-16-0`,
    counselorId: 'test-counselor',
    startAt: `${dayAfterTomorrowStr}T16:00:00`,
    endAt: `${dayAfterTomorrowStr}T16:30:00`,
    capacity: 3,
    bookedCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return slots;
};

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>(generateDummySlots());
  const [isLoading, setIsLoading] = useState(false);

  const addSlot = (slot: Slot) => {
    setSlots(prev => [...prev, slot]);
  };

  const updateSlot = (id: string, updates: Partial<Slot>) => {
    setSlots(prev => prev.map(slot => (slot.id === id ? { ...slot, ...updates } : slot)));
  };

  const removeSlot = (id: string) => {
    setSlots(prev => prev.filter(slot => slot.id !== id));
  };

  return {
    slots,
    isLoading,
    setIsLoading,
    addSlot,
    updateSlot,
    removeSlot,
    setSlots,
  };
}
