import { useState, useCallback } from 'react';
import type { Reservation } from '../types';

// 테스트용 더미 예약 데이터
const generateDummyReservations = (): Reservation[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 날짜의 슬롯 ID 생성 (10:00, 10:30, 15:00)
  const slotId1 = `slot-${today.toISOString().split('T')[0]}-10-0`;
  const slotId2 = `slot-${today.toISOString().split('T')[0]}-10-30`;
  const slotId3 = `slot-${today.toISOString().split('T')[0]}-15-0`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const slotId4 = `slot-${tomorrow.toISOString().split('T')[0]}-14-0`;

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const slotId5 = `slot-${dayAfterTomorrow.toISOString().split('T')[0]}-16-0`;

  return [
    {
      id: 'res-1',
      slotId: slotId1,
      email: 'user1@example.com',
      name: '홍길동',
      note: '첫 상담입니다. 궁금한 점이 많아요.',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-2',
      slotId: slotId1,
      email: 'user2@example.com',
      name: '김철수',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-3',
      slotId: slotId2,
      email: 'user3@example.com',
      name: '이영희',
      note: '재상담입니다.',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-4',
      slotId: slotId3,
      email: 'user4@example.com',
      name: '박민수',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-5',
      slotId: slotId3,
      email: 'user5@example.com',
      name: '최지영',
      note: '급하게 상담이 필요합니다.',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-6',
      slotId: slotId3,
      email: 'user6@example.com',
      name: '정수진',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-7',
      slotId: slotId4,
      email: 'user7@example.com',
      name: '강동원',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-8',
      slotId: slotId4,
      email: 'user8@example.com',
      name: '송혜교',
      note: '상담 전에 미리 준비할 자료가 있나요?',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'res-9',
      slotId: slotId5,
      email: 'user9@example.com',
      name: '윤아',
      status: 'BOOKED',
      createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>(generateDummyReservations());
  const [isLoading] = useState(false); // TODO: API 연동 시 로딩 상태 관리

  const cancelReservation = useCallback((reservationId: string) => {
    setReservations(prev =>
      prev.map(reservation =>
        reservation.id === reservationId
          ? { ...reservation, status: 'CANCELLED' as const, cancelledAt: new Date().toISOString() }
          : reservation,
      ),
    );
    // TODO: API 연동 후 활성화
  }, []);

  const editReservation = useCallback((reservation: Reservation) => {
    // TODO: 예약 수정 모달 오픈
    console.log('Edit reservation:', reservation);
  }, []);

  // TODO: API 연동 시 fetchReservations, createReservation 등 추가

  return {
    reservations,
    isLoading,
    cancelReservation,
    editReservation,
    // TODO: API 연동 시 필요한 함수들 추가
  };
}
