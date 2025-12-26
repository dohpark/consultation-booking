# Reservations Module Documentation

## 개요

예약 생성 API입니다. 예약자가 초대 토큰을 사용하여 상담 슬롯에 예약을 생성할 수 있습니다.

**핵심 기능**: 동시성 제어, 정원 제한, 중복 예약 방지를 트랜잭션으로 보장합니다.

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
    "cancelledAt": null
  },
  "message": "예약이 생성되었습니다."
}
```

**동작 방식:**

1. Token 검증 (`InvitationsService.validateToken()`)
2. 슬롯 조회 및 권한 확인 (token의 counselorId와 slot의 counselorId 일치 확인)
3. Email 정규화 (`toLowerCase().trim()`)
4. 트랜잭션으로 예약 생성:
   - 원자적 UPDATE로 `booked_count` 증가
   - 예약 INSERT
   - UNIQUE 충돌 시 롤백

**에러 응답:**

- `400 Bad Request`: 슬롯이 가득 참, 예약 생성 실패
- `401 Unauthorized`: 유효하지 않거나 만료된 토큰
- `403 Forbidden`: 다른 상담사의 슬롯 예약 시도
- `404 Not Found`: 슬롯을 찾을 수 없음
- `409 Conflict`: 이미 예약된 이메일 (같은 slot+email 중복)

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
├── reservations.controller.ts      # Admin 예약 관리 API (향후 확장)
├── reservations.service.ts         # 비즈니스 로직
├── reservations.repository.ts      # 데이터 접근 계층
├── reservations.module.ts          # 모듈 설정
├── dto/                            # 요청/응답 DTO
│   ├── create-reservation.dto.ts  # 예약 생성 요청 DTO
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

### 2. Repository 메서드

- `findSlotById`: 슬롯 조회 (권한 확인용)
- `createReservationWithLock`: 트랜잭션으로 좌석 확보 + 예약 생성
- `findById`: 예약 조회 (ID)

### 3. 동시성 제어 메커니즘

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

## 보안 고려사항

1. **Token 기반 인증**: 초대 토큰으로만 예약 가능
2. **권한 확인**: token의 상담사와 슬롯의 상담사 일치 확인
3. **Email 정규화**: SQL injection 방지 및 데이터 일관성
4. **트랜잭션**: 원자적 연산으로 데이터 정합성 보장
5. **UNIQUE 제약**: 데이터베이스 레벨에서 중복 방지

## 성능 고려사항

1. **인덱스 활용**: `email + createdAt` 인덱스로 조회 최적화
2. **트랜잭션 최소화**: 필요한 작업만 트랜잭션 내에서 처리
3. **Raw SQL**: Prisma ORM 오버헤드 최소화
4. **에러 처리**: 빠른 실패 (Fail Fast) 원칙

## 향후 확장 가능성

1. **예약 취소 API**: `POST /api/public/reservations/:id/cancel`
2. **예약 조회 API**: `GET /api/public/reservations?token=...`
3. **예약 수정**: 현재는 삭제 후 재생성 방식
4. **예약 알림**: 예약 생성 시 이메일/SMS 알림
5. **대기열 시스템**: 가득 찬 슬롯에 대기 예약 기능

