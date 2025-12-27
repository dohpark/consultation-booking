const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ConsultationNote {
  id: string;
  reservationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertConsultationNoteDto {
  content: string;
}

/**
 * 예약 ID로 상담 노트 조회
 */
export async function fetchConsultationNote(reservationId: string): Promise<ConsultationNote | null> {
  const url = getApiEndpoint(`/admin/reservations/${reservationId}/note`);

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '상담 노트 조회에 실패했습니다.' }));
    throw new Error(error.message || '상담 노트 조회에 실패했습니다.');
  }

  const data: ApiResponse<ConsultationNote | null> = await response.json();
  if (data.success) {
    return data.data ?? null;
  }

  throw new Error('상담 노트 조회에 실패했습니다.');
}

/**
 * 상담 노트 생성 또는 수정 (Upsert)
 */
export async function upsertConsultationNote(
  reservationId: string,
  dto: UpsertConsultationNoteDto,
): Promise<ConsultationNote> {
  const url = getApiEndpoint(`/admin/reservations/${reservationId}/note`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '상담 노트 저장에 실패했습니다.' }));
    throw new Error(error.message || '상담 노트 저장에 실패했습니다.');
  }

  const data: ApiResponse<ConsultationNote> = await response.json();
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('상담 노트 저장에 실패했습니다.');
}

