# Slots Module Documentation

## 개요

슬롯 관리 및 조회 API입니다. Admin은 슬롯을 생성, 조회, 삭제할 수 있고, Public 사용자는 토큰을 통해 예약 가능한 슬롯을 조회할 수 있습니다.

**핵심 기능**:

- 슬롯 생성: 단일 생성 및 배치 생성 (날짜 범위 + 시간대 목록)
- 슬롯 조회: Admin 날짜 범위 조회, Public 특정 날짜 조회 (예약 가능 여부 포함)
- 슬롯 삭제: 본인의 슬롯만 삭제 가능
- 슬롯별 예약 조회: Admin이 슬롯 클릭 시 예약자 리스트 확인

## API 엔드포인트

### POST /api/admin/slots

단일 슬롯 생성 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Request:**

```json
{
  "startAt": "2025-01-10T10:00:00.000Z",
  "endAt": "2025-01-10T10:30:00.000Z",
  "capacity": 3
}
```

**Request DTO:**

- `startAt` (required): 시작 시간 (ISO 8601 datetime string)
- `endAt` (required): 종료 시간 (ISO 8601 datetime string)
- `capacity` (optional): 수용 인원 (기본값: 3)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "slot-uuid",
    "counselorId": "counselor-uuid",
    "startAt": "2025-01-10T10:00:00.000Z",
    "endAt": "2025-01-10T10:30:00.000Z",
    "capacity": 3,
    "bookedCount": 0,
    "availableCount": 3,
    "createdAt": "2025-01-10T09:00:00.000Z",
    "updatedAt": "2025-01-10T09:00:00.000Z"
  },
  "message": "슬롯이 생성되었습니다."
}
```

**동작 방식:**

1. 30분 단위 검증 (정확히 30분이어야 함)
2. 중복 확인 (같은 상담사, 같은 시작/종료 시간)
3. 슬롯 생성

**에러 응답:**

- `400 Bad Request`: 슬롯이 정확히 30분 단위가 아님
- `409 Conflict`: 이미 존재하는 슬롯

### POST /api/admin/slots/batch

배치 슬롯 생성 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Request:**

```json
{
  "startDate": "2025-01-10",
  "endDate": "2025-01-15",
  "timeSlots": ["09:00", "10:00", "11:00", "14:00", "15:00"],
  "capacity": 3,
  "excludeDates": ["2025-01-12"]
}
```

**Request DTO:**

- `startDate` (required): 시작 날짜 (YYYY-MM-DD)
- `endDate` (required): 종료 날짜 (YYYY-MM-DD)
- `timeSlots` (required): 시간대 목록 (HH:MM 형식)
- `capacity` (optional): 수용 인원 (기본값: 3)
- `excludeDates` (optional): 제외할 날짜 목록 (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "slot-uuid-1",
      "counselorId": "counselor-uuid",
      "startAt": "2025-01-10T09:00:00.000Z",
      "endAt": "2025-01-10T09:30:00.000Z",
      "capacity": 3,
      "bookedCount": 0,
      "availableCount": 3,
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z"
    }
    // ... 더 많은 슬롯
  ],
  "message": "5개의 슬롯이 생성되었습니다."
}
```

**동작 방식:**

1. 날짜 범위 검증
2. 각 날짜와 시간대 조합으로 슬롯 생성
3. 제외 날짜는 건너뛰기
4. 중복 슬롯은 건너뛰기
5. 트랜잭션으로 배치 생성

**에러 응답:**

- `400 Bad Request`: 시작 날짜가 종료 날짜보다 늦음, 생성할 슬롯이 없음

### GET /api/admin/slots?from=YYYY-MM-DD&to=YYYY-MM-DD

날짜 범위 슬롯 조회 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Query Parameters:**

- `from` (required): 시작 날짜 (YYYY-MM-DD)
- `to` (required): 종료 날짜 (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "slot-uuid",
      "counselorId": "counselor-uuid",
      "startAt": "2025-01-10T10:00:00.000Z",
      "endAt": "2025-01-10T10:30:00.000Z",
      "capacity": 3,
      "bookedCount": 2,
      "availableCount": 1,
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    }
  ]
}
```

**에러 응답:**

- `400 Bad Request`: 시작 날짜가 종료 날짜보다 늦음

### GET /api/admin/slots/:id

슬롯 조회 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "slot-uuid",
    "counselorId": "counselor-uuid",
    "startAt": "2025-01-10T10:00:00.000Z",
    "endAt": "2025-01-10T10:30:00.000Z",
    "capacity": 3,
    "bookedCount": 2,
    "availableCount": 1,
    "createdAt": "2025-01-10T09:00:00.000Z",
    "updatedAt": "2025-01-10T09:00:00.000Z"
  }
}
```

**에러 응답:**

- `404 Not Found`: 슬롯을 찾을 수 없음

### GET /api/admin/slots/:id/reservations

슬롯별 예약 내역 조회 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "reservation-uuid-1",
      "slotId": "slot-uuid",
      "email": "client1@example.com",
      "name": "홍길동",
      "note": "첫 상담입니다",
      "status": "BOOKED",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T10:00:00.000Z",
      "cancelledAt": null
    },
    {
      "id": "reservation-uuid-2",
      "slotId": "slot-uuid",
      "email": "client2@example.com",
      "name": "김철수",
      "note": null,
      "status": "CANCELLED",
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:30:00.000Z",
      "cancelledAt": "2025-01-10T09:30:00.000Z"
    }
  ]
}
```

**동작 방식:**

1. 슬롯 조회 및 권한 확인 (슬롯의 `counselorId`와 현재 사용자의 `userId` 일치 확인)
2. 예약 목록 조회 (생성일 기준 오름차순 정렬)
3. DTO 변환 및 반환

**에러 응답:**

- `403 Forbidden`: 본인의 슬롯이 아님
- `404 Not Found`: 슬롯을 찾을 수 없음

### DELETE /api/admin/slots/:id

슬롯 삭제 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Response:**

```json
{
  "success": true,
  "data": null,
  "message": "슬롯이 삭제되었습니다."
}
```

**동작 방식:**

1. 슬롯 조회
2. 권한 확인 (본인의 슬롯만 삭제 가능)
3. 예약 확인 (BOOKED 상태의 예약이 있으면 삭제 불가)
4. 슬롯 삭제

**에러 응답:**

- `400 Bad Request`: 본인의 슬롯이 아님 또는 예약이 있는 슬롯
- `404 Not Found`: 슬롯을 찾을 수 없음

### GET /api/public/slots?date=YYYY-MM-DD&token=...

특정 날짜 슬롯 조회 API (Public)

**인증**: 불필요 (token 기반 인증)

**Query Parameters:**

- `date` (required): 조회할 날짜 (YYYY-MM-DD)
- `token` (required): 초대 토큰

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "slot-uuid",
      "counselorId": "counselor-uuid",
      "startAt": "2025-01-10T10:00:00.000Z",
      "endAt": "2025-01-10T10:30:00.000Z",
      "capacity": 3,
      "bookedCount": 2,
      "availableCount": 1,
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-10T09:00:00.000Z"
    }
  ]
}
```

**동작 방식:**

1. Token 검증 (`InvitationsService.validateToken()`)
2. Token의 `counselorId`로 해당 날짜의 슬롯 조회
3. 예약 가능 여부 포함하여 반환

**에러 응답:**

- `400 Bad Request`: 토큰이 필요함

## 파일 구조

```
slots/
├── admin-slots.controller.ts      # Admin 슬롯 관리 API
├── public-slots.controller.ts     # Public 슬롯 조회 API
├── slots.service.ts               # 비즈니스 로직
├── slots.repository.ts            # 데이터 접근 계층
├── slots.module.ts               # 모듈 설정
├── dto/                          # 요청/응답 DTO
│   ├── create-slot.dto.ts       # 단일 슬롯 생성 요청 DTO
│   ├── create-batch-slots.dto.ts # 배치 슬롯 생성 요청 DTO
│   └── slot-response.dto.ts     # 슬롯 응답 DTO
└── docs/
    └── README.md                 # 이 문서
```

## 주요 기능

### 1. 단일 슬롯 생성 (`createSlot`)

**처리 순서:**

1. **30분 단위 검증**: 정확히 30분이어야 함
2. **중복 확인**: 같은 상담사, 같은 시작/종료 시간
3. **슬롯 생성**: `bookedCount`는 0으로 초기화

### 2. 배치 슬롯 생성 (`createBatchSlots`)

**처리 순서:**

1. **날짜 범위 검증**: 시작 날짜가 종료 날짜보다 이전이어야 함
2. **날짜 범위 순회**: 각 날짜마다 시간대 목록 적용
3. **제외 날짜 처리**: `excludeDates`에 포함된 날짜는 건너뛰기
4. **중복 확인**: 이미 존재하는 슬롯은 건너뛰기
5. **배치 생성**: 트랜잭션으로 모든 슬롯 생성

### 3. 슬롯 조회

- `getSlotById`: ID로 슬롯 조회
- `getSlotsByDateRange`: 상담사별 날짜 범위 조회
- `getPublicSlotsByDate`: Public 특정 날짜 조회 (예약 가능 여부 포함)

### 4. 슬롯 삭제 (`deleteSlot`)

**처리 순서:**

1. **슬롯 조회**: ID로 슬롯 조회
2. **권한 확인**: 슬롯의 `counselorId`와 현재 사용자의 `userId` 일치 확인
3. **슬롯 삭제**

## 프론트엔드 연동

### Admin: 슬롯 생성

```typescript
// 단일 슬롯 생성
const response = await fetch('http://localhost:3002/api/admin/slots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    startAt: '2025-01-10T10:00:00.000Z',
    endAt: '2025-01-10T10:30:00.000Z',
    capacity: 3,
  }),
});

const data = await response.json();
if (data.success) {
  console.log('슬롯 생성 성공:', data.data);
}
```

### Admin: 배치 슬롯 생성

```typescript
// 배치 슬롯 생성
const response = await fetch('http://localhost:3002/api/admin/slots/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    startDate: '2025-01-10',
    endDate: '2025-01-15',
    timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    capacity: 3,
    excludeDates: ['2025-01-12'],
  }),
});

const data = await response.json();
if (data.success) {
  console.log(`${data.data.length}개의 슬롯이 생성되었습니다.`);
}
```

### Admin: 슬롯별 예약 조회

```typescript
// 슬롯별 예약 내역 조회
const response = await fetch('http://localhost:3002/api/admin/slots/slot-uuid/reservations', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
});

const data = await response.json();
if (data.success) {
  console.log('예약 목록:', data.data);
}
```

### Public: 슬롯 조회

```typescript
// 특정 날짜 슬롯 조회
const response = await fetch(
  'http://localhost:3002/api/public/slots?date=2025-01-10&token=a1b2c3d4e5f6...',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  },
);

const data = await response.json();
if (data.success) {
  console.log('슬롯 목록:', data.data);
  // availableCount를 확인하여 예약 가능 여부 판단
}
```

## 보안 고려사항

1. **Admin 권한**: AdminRoleGuard로 보호
2. **권한 확인**: 본인의 슬롯만 삭제/조회 가능
3. **Token 검증**: Public API는 token 기반 인증
4. **중복 방지**: 같은 상담사, 같은 시간대 중복 슬롯 생성 방지

## 성능 고려사항

1. **인덱스 활용**: `counselorId + startAt` 인덱스로 조회 최적화
2. **배치 생성**: 트랜잭션으로 여러 슬롯을 한 번에 생성
3. **중복 확인**: 배치 생성 시 중복 슬롯은 건너뛰기

## 향후 확장 가능성

1. **슬롯 수정**: 현재는 삭제 후 재생성 방식
2. **슬롯 복사**: 기존 슬롯을 기반으로 새 슬롯 생성
3. **슬롯 템플릿**: 자주 사용하는 시간대를 템플릿으로 저장
4. **슬롯 통계**: 예약률, 인기 시간대 등 통계 제공

