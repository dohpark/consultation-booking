# Reservations Module Documentation

## 개요

예약 생성, 취소, 상태 전이, 조회 API입니다. 예약자가 초대 토큰을 사용하여 상담 슬롯에 예약을 생성하고 취소할 수 있고, Admin은 예약 상태를 전이하고 슬롯별 예약 내역을 조회할 수 있습니다.

## 필수 설정

### 환경 변수 설정

`apps/server/.env` 파일에 다음 환경 변수를 설정하세요:

```env
# ReservationToken 만료일 (일 단위, 기본값: 30일)
RESERVATION_TOKEN_EXPIRES_DAYS=30
```

**참고**: 환경 변수가 설정되지 않은 경우 기본값 30일이 사용됩니다.

**핵심 기능**:

- 예약 생성: 동시성 제어, 정원 제한, 중복 예약 방지를 트랜잭션으로 보장, ReservationToken 자동 발급
- 예약 취소:
  - InviteToken 기반: email 일치 확인, `booked_count` 자동 회복
  - ReservationToken 기반: 토큰 검증, `booked_count` 자동 회복, 멱등성 보장
- 상태 전이: 멱등성 보장, `booked_count` 자동 관리
- 슬롯별 예약 조회: Admin이 슬롯 클릭 시 예약자 리스트 확인

## API 엔드포인트

### POST /api/public/reservations

예약 생성 API (Public 엔드포인트)

**인증**: 불필요 (token 기반 인증)

**Request:**

```json
{
  "token": "a1b2c3d4e5f6...",
  "slotId": "slot-uuid",
  "name": "홍길동",
  "email": "client@example.com",
  "note": "첫 상담입니다"
}
```

**Request DTO:**

- `token` (required): 초대 토큰 (InvitationsService로 검증)
- `slotId` (required): 예약할 슬롯 ID
- `name` (required): 예약자 이름
- `email` (optional): 예약자 이메일 (없으면 token에서 추출)
- `note` (optional): 예약 메모

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "reservation-uuid",
    "slotId": "slot-uuid",
    "email": "client@example.com",
    "name": "홍길동",
    "note": "첫 상담입니다",
    "status": "BOOKED",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T10:00:00.000Z",
    "cancelledAt": null,
    "reservationToken": "a1b2c3d4e5f6..."
  },
  "message": "예약이 생성되었습니다."
}
```

**참고**: 예약 생성 시 `reservationToken`이 응답에 포함됩니다. 이 토큰은 예약 취소용으로 사용할 수 있습니다 (기본 만료일: 30일).

**동작 방식:**

1. Token 검증 (`InvitationsService.validateToken()`)
2. 슬롯 조회 및 권한 확인 (token의 counselorId와 slot의 counselorId 일치 확인)
3. Email 정규화 (`toLowerCase().trim()`)
4. 트랜잭션으로 예약 생성:
   - 원자적 UPDATE로 `booked_count` 증가
   - 예약 INSERT
   - UNIQUE 충돌 시 롤백
5. ReservationToken 자동 발급 (예약 취소용, 기본 만료일: 30일)

**에러 응답:**

- `400 Bad Request`: 슬롯이 가득 참, 예약 생성 실패
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `403 Forbidden`: 다른 상담사의 슬롯 예약 시도
- `404 Not Found`: 슬롯을 찾을 수 없음
- `409 Conflict`: 이미 예약된 이메일 (같은 slot+email 중복)

### POST /api/public/reservations/:id/cancel

예약 취소 API (Public 엔드포인트)

**인증**: 불필요 (token 기반 인증)

**Request:**

```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Request DTO:**

- `token` (required): 초대 토큰 (InvitationsService로 검증)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "reservation-uuid",
    "slotId": "slot-uuid",
    "email": "client@example.com",
    "name": "홍길동",
    "note": "첫 상담입니다",
    "status": "CANCELLED",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T11:00:00.000Z",
    "cancelledAt": "2025-01-10T11:00:00.000Z"
  },
  "message": "예약이 취소되었습니다."
}
```

**동작 방식:**

1. Token 검증 (`InvitationsService.validateToken()`)
2. 예약 조회
3. Token의 `email`과 reservation의 `email` 일치 확인
4. 상태 전이 (DEV-54 로직 재사용):
   - `WHERE status='BOOKED'` 조건으로 멱등하게 처리
   - UPDATE 결과가 0이면 아무것도 하지 않음 (이미 CANCELLED)
   - UPDATE 결과가 1이면 `booked_count - 1` (슬롯 잔여 인원 회복)
   - `cancelledAt` 자동 기록

**에러 응답:**

- `400 Bad Request`: 예약 취소 실패
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `403 Forbidden`: 본인의 예약이 아님 (email 불일치)
- `404 Not Found`: 예약을 찾을 수 없음

### POST /api/public/reservations/cancel?token=...

예약 취소 API (Public 엔드포인트 - ReservationToken 기반)

**인증**: 불필요 (ReservationToken 기반 인증)

**Query Parameters:**

- `token` (required): ReservationToken (예약 생성 시 발급된 토큰)

**Request Example:**

```
POST /api/public/reservations/cancel?token=a1b2c3d4e5f6...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "reservation-uuid",
    "slotId": "slot-uuid",
    "email": "client@example.com",
    "name": "홍길동",
    "note": "첫 상담입니다",
    "status": "CANCELLED",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T11:00:00.000Z",
    "cancelledAt": "2025-01-10T11:00:00.000Z"
  },
  "message": "예약이 취소되었습니다."
}
```

**동작 방식:**

1. ReservationToken 검증 (토큰 존재 및 만료 확인)
2. 예약 조회 (토큰의 reservationId로)
3. 예약 상태 확인 (이미 취소된 경우 멱등하게 현재 상태 반환)
4. 상태 전이 (DEV-54 로직 재사용):
   - `WHERE status='BOOKED'` 조건으로 멱등하게 처리
   - UPDATE 결과가 0이면 아무것도 하지 않음 (이미 CANCELLED)
   - UPDATE 결과가 1이면 `booked_count - 1` (슬롯 잔여 인원 회복)
   - `cancelledAt` 자동 기록

**에러 응답:**

- `400 Bad Request`: 토큰 파라미터 없음, 예약 취소 실패
- `404 Not Found`: 유효하지 않거나 만료된 토큰, 예약을 찾을 수 없음

**참고**: 이 API는 ReservationToken 기반 취소입니다. InviteToken 기반 취소는 `POST /api/public/reservations/:id/cancel`을 사용하세요.

### PATCH /api/admin/reservations/:id/status

예약 상태 전이 API (Admin 전용)

**인증**: AdminRoleGuard (JWT 인증 필요)

**Request:**

```json
{
  "status": "CANCELLED"
}
```

또는

```json
{
  "status": "COMPLETED"
}
```

**Request DTO:**

- `status` (required): 전이할 상태 (`CANCELLED` 또는 `COMPLETED`)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "reservation-uuid",
    "slotId": "slot-uuid",
    "email": "client@example.com",
    "name": "홍길동",
    "note": "첫 상담입니다",
    "status": "CANCELLED",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T11:00:00.000Z",
    "cancelledAt": "2025-01-10T11:00:00.000Z"
  },
  "message": "예약 상태가 변경되었습니다."
}
```

**동작 방식:**

1. 예약 조회 (존재 여부 확인)
2. 상태 전이 (트랜잭션):
   - `WHERE status='BOOKED'` 조건으로 멱등하게 처리
   - UPDATE 결과가 0이면 아무것도 하지 않음 (이미 전이됨)
   - UPDATE 결과가 1이면 `booked_count - 1` (방어적으로 `AND booked_count > 0`)
   - CANCELLED인 경우 `cancelledAt` 기록
3. 업데이트된 예약 반환

**멱등성 보장:**

- 이미 CANCELLED/COMPLETED인 예약을 다시 호출해도 `booked_count`가 더 줄지 않음
- 중복 호출이 있어도 안전하게 처리됨

**에러 응답:**

- `400 Bad Request`: 예약 상태 전이 실패
- `404 Not Found`: 예약을 찾을 수 없음

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

## 동시성 제어

### 핵심 로직

예약 생성 시 동시성 문제를 해결하기 위해 **원자적 UPDATE**를 사용합니다:

```sql
UPDATE slots
SET booked_count = booked_count + 1
WHERE id = $1
  AND booked_count < capacity
```

### 동작 원리

1. **원자적 업데이트**: `booked_count < capacity` 조건을 WHERE 절에 포함하여, 조건을 만족하는 경우에만 업데이트
2. **트랜잭션 격리 수준**: `Serializable` (최고 격리 수준)
3. **자동 롤백**: 예약 INSERT 실패 시 트랜잭션 롤백으로 `booked_count` 자동 복구

### 동시성 테스트 시나리오

```
슬롯 상태: capacity = 3, booked_count = 0
동시에 10개의 예약 요청이 들어옴

결과:
- 첫 3개 요청: UPDATE 성공 → 예약 생성 성공 ✅
- 나머지 7개 요청: UPDATE 실패 (booked_count = 3, 조건 불만족) → 400 에러 ❌

최종 booked_count = 3 (capacity 초과 안 함) ✅
```

### 상태 전이 시 booked_count 관리

예약 상태를 `BOOKED → CANCELLED/COMPLETED`로 전이할 때 `booked_count`를 안전하게 감소시킵니다:

```sql
-- 1. 상태 전이 (멱등성 보장)
UPDATE reservations
SET status = 'CANCELLED', cancelled_at = NOW()
WHERE id = $1
  AND status = 'BOOKED';  -- 핵심: BOOKED 상태인 것만 업데이트

-- 2. booked_count 감소 (방어적 처리)
UPDATE slots
SET booked_count = booked_count - 1
WHERE id = $2
  AND booked_count > 0;  -- 방어적 조건
```

**동작 원리:**

1. **멱등성 보장**: `WHERE status='BOOKED'` 조건으로 이미 전이된 예약은 업데이트되지 않음
2. **조건부 감소**: UPDATE 결과가 1일 때만 `booked_count - 1`
3. **방어적 처리**: `booked_count > 0` 조건으로 음수 방지
4. **트랜잭션**: 모든 작업이 하나의 트랜잭션으로 처리되어 원자성 보장

**멱등성 테스트 시나리오:**

```
예약 상태: BOOKED
1차 호출: BOOKED → CANCELLED (booked_count - 1) ✅
2차 호출: 이미 CANCELLED (booked_count 변화 없음) ✅
3차 호출: 이미 CANCELLED (booked_count 변화 없음) ✅

최종 booked_count = 정확히 -1 (중복 감소 없음) ✅
```

## 에러 처리

### 400 Bad Request

- **슬롯이 가득 참**: `booked_count >= capacity`
- **예약 생성 실패**: 기타 예상치 못한 에러

### 401 Unauthorized

- **유효하지 않은 토큰**: 토큰이 존재하지 않음
- **만료된 토큰**: `expiresAt < 현재시간`

### 403 Forbidden

- **권한 없음**: token의 `counselorId`와 slot의 `counselorId`가 일치하지 않음
- 다른 상담사의 슬롯은 예약할 수 없음

### 404 Not Found

- **슬롯 없음**: `slotId`에 해당하는 슬롯이 존재하지 않음

### 409 Conflict

- **중복 예약**: 같은 `slotId` + `email` 조합으로 이미 예약이 존재
- UNIQUE 제약 위반 (`uniq_reservation_slot_email`)
- 트랜잭션 롤백으로 `booked_count` 자동 복구

### 상태 전이 에러

- **400 Bad Request**: 예약 상태 전이 실패 (예상치 못한 에러)
- **404 Not Found**: 예약을 찾을 수 없음

### 예약 취소 에러

- **400 Bad Request**: 예약 취소 실패 (예상치 못한 에러)
- **401 Unauthorized**: 유효하지 않거나 만료된 토큰
- **403 Forbidden**: 본인의 예약이 아님 (token의 `email`과 reservation의 `email` 불일치)
- **404 Not Found**: 예약을 찾을 수 없음

### 슬롯별 예약 조회 에러

- **403 Forbidden**: 본인의 슬롯이 아님 (슬롯의 `counselorId`와 현재 사용자의 `userId` 불일치)
- **404 Not Found**: 슬롯을 찾을 수 없음

## 데이터베이스 스키마

### Reservation 모델

```prisma
model Reservation {
  id          String            @id @default(uuid())
  slotId      String            @map("slot_id")
  email       String
  name        String
  note        String?           @db.Text
  status      ReservationStatus @default(BOOKED)
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")
  cancelledAt DateTime?         @map("cancelled_at")

  slot             Slot              @relation(...)
  reservationToken ReservationToken?
  consultationNote ConsultationNote?

  @@unique([slotId, email], name: "uniq_reservation_slot_email")
  @@index([email, createdAt(sort: Desc)])
  @@map("reservations")
}
```

**제약 조건:**

- `@@unique([slotId, email])`: 같은 슬롯에 같은 이메일 중복 예약 방지
- `@@index([email, createdAt])`: 이메일별 조회 최적화

## 파일 구조

```
reservations/
├── public-reservations.controller.ts  # Public 예약 생성 API
├── reservations.controller.ts      # Admin 예약 관리 API (상태 전이)
├── reservations.service.ts         # 비즈니스 로직
├── reservations.repository.ts      # 데이터 접근 계층
├── reservations.module.ts          # 모듈 설정
├── dto/                            # 요청/응답 DTO
│   ├── create-reservation.dto.ts  # 예약 생성 요청 DTO
│   ├── transition-reservation.dto.ts # 상태 전이 요청 DTO
│   └── reservation-response.dto.ts # 예약 응답 DTO
└── docs/
    └── README.md                   # 이 문서
```

## 주요 기능

### 1. 예약 생성 (`createReservation`)

**처리 순서:**

1. **Token 검증**: `InvitationsService.validateToken()` 호출
2. **슬롯 조회**: `slotId`로 슬롯 조회
3. **권한 확인**: token의 `counselorId`와 slot의 `counselorId` 일치 확인
4. **Email 정규화**: `toLowerCase().trim()`
5. **트랜잭션 실행**:
   - 원자적 UPDATE로 `booked_count` 증가
   - 예약 INSERT
   - 에러 발생 시 롤백

### 2. 예약 취소 (`cancelReservation`)

**처리 순서:**

1. **Token 검증**: `InvitationsService.validateToken()` 호출
2. **예약 조회**: `reservationId`로 예약 조회
3. **Email 일치 확인**: token의 `email`과 reservation의 `email` 일치 확인
4. **상태 전이**: DEV-54의 `transitionReservationStatus` 로직 재사용
   - `WHERE status='BOOKED'` 조건으로 멱등하게 처리
   - 취소 성공 시 `booked_count - 1` (슬롯 잔여 인원 회복)
   - `cancelledAt` 자동 기록

### 3. 예약 상태 전이 (`transitionReservationStatus`)

**처리 순서:**

1. **예약 조회**: `reservationId`로 예약 조회 (존재 여부 확인)
2. **상태 전이**: 트랜잭션으로 처리:
   - `WHERE status='BOOKED'` 조건으로 멱등하게 처리
   - UPDATE 결과가 0이면 아무것도 하지 않음 (이미 전이됨)
   - UPDATE 결과가 1이면 `booked_count - 1` (방어적으로 `AND booked_count > 0`)
   - CANCELLED인 경우 `cancelledAt` 기록
3. **업데이트된 예약 반환**

### 4. 슬롯별 예약 조회 (`getReservationsBySlotId`)

**처리 순서:**

1. **슬롯 조회**: `slotId`로 슬롯 조회
2. **권한 확인**: 슬롯의 `counselorId`와 현재 사용자의 `userId` 일치 확인
3. **예약 목록 조회**: 생성일 기준 오름차순 정렬
4. **DTO 변환**: 모든 예약을 `ReservationResponseDto`로 변환

### 5. Repository 메서드

- `findSlotById`: 슬롯 조회 (권한 확인용)
- `createReservationWithLock`: 트랜잭션으로 좌석 확보 + 예약 생성
- `findById`: 예약 조회 (ID)
- `findBySlotId`: 슬롯별 예약 목록 조회 (생성일 기준 오름차순)
- `transitionReservationStatus`: 트랜잭션으로 상태 전이 + `booked_count` 감소

### 4. 동시성 제어 메커니즘

**Raw SQL 사용:**

```typescript
await tx.$executeRaw`
  UPDATE slots
  SET booked_count = booked_count + 1
  WHERE id = ${slotId}
    AND booked_count < capacity
`;
```

**장점:**

- 원자적 연산으로 Race Condition 방지
- WHERE 조건으로 정원 초과 자동 방지
- UPDATE 결과로 성공/실패 판단 가능

**트랜잭션 격리 수준:**

- `Serializable`: 최고 격리 수준
- Phantom Read, Dirty Read, Non-repeatable Read 모두 방지

## 프론트엔드 연동

### 예약 생성

```typescript
// 예약 생성
const response = await fetch('http://localhost:3002/api/public/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'a1b2c3d4e5f6...', // URL에서 가져온 토큰
    slotId: 'slot-uuid',
    name: '홍길동',
    email: 'client@example.com', // 선택사항
    note: '첫 상담입니다', // 선택사항
  }),
});

const data = await response.json();
if (data.success) {
  console.log('예약 생성 성공:', data.data);
} else {
  console.error('예약 생성 실패:', data.error);
}
```

### 에러 처리 예시

```typescript
try {
  const response = await fetch('http://localhost:3002/api/public/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, slotId, name, email }),
  });

  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 400:
        // 슬롯이 가득 참
        alert('슬롯이 가득 찼습니다.');
        break;
      case 401:
        // 유효하지 않은 토큰
        alert('유효하지 않은 토큰입니다.');
        break;
      case 403:
        // 권한 없음
        alert('예약할 수 없는 슬롯입니다.');
        break;
      case 404:
        // 슬롯 없음
        alert('슬롯을 찾을 수 없습니다.');
        break;
      case 409:
        // 중복 예약
        alert('이미 예약된 이메일입니다.');
        break;
    }
    return;
  }

  console.log('예약 생성 성공:', data.data);
} catch (error) {
  console.error('네트워크 에러:', error);
}
```

### 예약 취소

```typescript
// 예약 취소 (Public API)
const response = await fetch('http://localhost:3002/api/public/reservations/reservation-uuid/cancel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'a1b2c3d4e5f6...', // URL에서 가져온 토큰
  }),
});

const data = await response.json();
if (data.success) {
  console.log('예약 취소 성공:', data.data);
} else {
  console.error('예약 취소 실패:', data.error);
}
```

### 에러 처리 예시

```typescript
try {
  const response = await fetch('http://localhost:3002/api/public/reservations/reservation-uuid/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'a1b2c3d4e5f6...' }),
  });

  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 400:
        // 예약 취소 실패
        alert('예약 취소에 실패했습니다.');
        break;
      case 401:
        // 유효하지 않은 토큰
        alert('유효하지 않은 토큰입니다.');
        break;
      case 403:
        // 본인의 예약이 아님
        alert('본인의 예약만 취소할 수 있습니다.');
        break;
      case 404:
        // 예약 없음
        alert('예약을 찾을 수 없습니다.');
        break;
    }
    return;
  }

  console.log('예약 취소 성공:', data.data);
} catch (error) {
  console.error('네트워크 에러:', error);
}
```

### 예약 상태 전이

```typescript
// 예약 취소 (Admin 전용)
const response = await fetch('http://localhost:3002/api/admin/reservations/reservation-uuid/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    // JWT 쿠키는 자동으로 전송됨 (credentials: 'include')
  },
  credentials: 'include',
  body: JSON.stringify({
    status: 'CANCELLED', // 또는 'COMPLETED'
  }),
});

const data = await response.json();
if (data.success) {
  console.log('예약 상태 전이 성공:', data.data);
} else {
  console.error('예약 상태 전이 실패:', data.error);
}
```

### 에러 처리 예시

```typescript
try {
  const response = await fetch('http://localhost:3002/api/admin/reservations/reservation-uuid/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status: 'CANCELLED' }),
  });

  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 400:
        // 예약 상태 전이 실패
        alert('예약 상태 전이에 실패했습니다.');
        break;
      case 404:
        // 예약 없음
        alert('예약을 찾을 수 없습니다.');
        break;
    }
    return;
  }

  console.log('예약 상태 전이 성공:', data.data);
} catch (error) {
  console.error('네트워크 에러:', error);
}
```

### 슬롯별 예약 조회

```typescript
// 슬롯별 예약 내역 조회 (Admin 전용)
const response = await fetch('http://localhost:3002/api/admin/slots/slot-uuid/reservations', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // JWT 쿠키는 자동으로 전송됨 (credentials: 'include')
  },
  credentials: 'include',
});

const data = await response.json();
if (data.success) {
  console.log('예약 목록:', data.data);
  // data.data는 ReservationResponseDto[] 배열
} else {
  console.error('예약 조회 실패:', data.error);
}
```

### 에러 처리 예시

```typescript
try {
  const response = await fetch('http://localhost:3002/api/admin/slots/slot-uuid/reservations', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    switch (response.status) {
      case 403:
        // 본인의 슬롯이 아님
        alert('본인의 슬롯만 조회할 수 있습니다.');
        break;
      case 404:
        // 슬롯 없음
        alert('슬롯을 찾을 수 없습니다.');
        break;
    }
    return;
  }

  console.log('예약 목록:', data.data);
} catch (error) {
  console.error('네트워크 에러:', error);
}
```

## 보안 고려사항

1. **Token 기반 인증**:
   - InviteToken: 예약 페이지 접근 및 예약 생성용
   - ReservationToken: 예약 취소 전용 (예약 생성 시 자동 발급)
2. **권한 확인**: token의 상담사와 슬롯의 상담사 일치 확인
3. **Email 정규화**: SQL injection 방지 및 데이터 일관성
4. **트랜잭션**: 원자적 연산으로 데이터 정합성 보장
5. **UNIQUE 제약**: 데이터베이스 레벨에서 중복 방지
6. **토큰 만료**: ReservationToken은 기본 30일 후 만료 (환경 변수로 설정 가능)
7. **멱등성**: 중복 취소 호출해도 안전하게 처리

## 성능 고려사항

1. **인덱스 활용**: `email + createdAt` 인덱스로 조회 최적화
2. **트랜잭션 최소화**: 필요한 작업만 트랜잭션 내에서 처리
3. **Raw SQL**: Prisma ORM 오버헤드 최소화
4. **에러 처리**: 빠른 실패 (Fail Fast) 원칙

## 향후 확장 가능성

1. **Public 예약 취소 API**: `POST /api/public/reservations/:id/cancel` (token 기반)
2. **예약 조회 API**: `GET /api/public/reservations?token=...`
3. **예약 수정**: 현재는 삭제 후 재생성 방식
4. **예약 알림**: 예약 생성 시 이메일/SMS 알림
5. **대기열 시스템**: 가득 찬 슬롯에 대기 예약 기능
6. **상태 전이 히스토리**: 예약 상태 변경 이력 추적
