import { useState } from 'react';
import type { Slot } from '../types';

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>([]);
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

