# 상담예약 시스템 ERD

> **참고**: 상세한 데이터베이스 설계 및 제약조건, 인덱스 설계는 [DB_DESIGN.md](./DB_DESIGN.md)를 참조하세요.

## 개요

상담사 스케줄 관리, 신청자 예약, 상담 이력 관리를 위한 데이터베이스 스키마입니다.

## ERD 다이어그램

```
┌─────────────────┐
│   counselors    │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ name            │
│ google_sub (UK) │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
         ├─────────────────────────────┐
         │                             │
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌─────────────────┐
│     slots       │         │  invite_tokens  │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ counselor_id(FK)│         │ counselor_id(FK)│
│ start_at        │         │ token (UNIQUE)  │
│ end_at          │         │ expires_at      │
│ capacity (3)    │         │ created_at      │
│ booked_count (0)│         └─────────────────┘
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
         ├─────────────────────────────┐
         │                             │
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌─────────────────┐
│  reservations   │         │consultation_notes│
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ slot_id (FK)    │         │ reservation_id  │
│ email           │         │   (FK, UNIQUE)  │
│ name            │         │ slot_id (FK)    │
│ note            │         │ content         │
│ status          │         │ created_at      │
│ created_at      │         │ updated_at      │
│ updated_at      │         └─────────────────┘
│ cancelled_at    │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────┐
│reservation_tokens│
├─────────────────┤
│ id (PK)         │
│ reservation_id  │
│   (FK, UNIQUE)  │
│ token (UNIQUE)  │
│ expires_at      │
│ created_at      │
└─────────────────┘
```

## 테이블 관계 설명

### 1. counselors (상담사)

- **역할**: Google OAuth로 로그인한 관리자(상담사) 정보
- **관계**:
  - `1:N` → `slots` (한 상담사가 여러 슬롯 생성)
  - `1:N` → `invite_tokens` (한 상담사가 여러 초대 링크 생성)

### 2. slots (상담 슬롯)

- **역할**: 30분 단위 상담 시간대
- **제약조건**:
  - `capacity`: 기본값 3 (최대 3명 예약 가능)
  - `booked_count`: 기본값 0 (현재 예약 수, 동시성 제어용)
  - `CHECK (booked_count >= 0 AND booked_count <= capacity)`: booked_count 범위 검증
  - `CHECK (capacity > 0)`: capacity 양수 검증
  - `index(counselor_id, start_at)`: 상담사별 시간 조회 최적화
- **관계**:
  - `N:1` → `counselors` (슬롯은 한 상담사에 속함)
  - `1:N` → `reservations` (한 슬롯에 여러 예약 가능)
  - `1:N` → `consultation_notes` (한 슬롯에 여러 상담 기록 가능 - 예약별로 기록)

### 3. reservations (예약)

- **역할**: 신청자의 예약 정보
- **제약조건**:
  - `unique(slot_id, email)`: 같은 슬롯에 같은 이메일 중복 예약 방지
  - `status`: BOOKED, CANCELLED, COMPLETED
- **관계**:
  - `N:1` → `slots` (예약은 한 슬롯에 속함)
  - `1:1` → `reservation_tokens` (예약당 하나의 관리 토큰)
  - `1:1` → `consultation_notes` (예약당 하나의 상담 기록)

### 4. invite_tokens (초대 토큰)

- **역할**: 예약 페이지 접근용 토큰
- **특징**:
  - 만료 시간 있음
  - 예약 취소/수정 권한 없음
- **관계**:
  - `N:1` → `counselors` (토큰은 한 상담사에 속함)

### 5. reservation_tokens (예약 관리 토큰)

- **역할**: 예약 취소용 토큰
- **특징**:
  - 예약 1건당 1개
  - 취소 권한만 부여
- **관계**:
  - `1:1` → `reservations` (토큰은 한 예약에 속함)

### 6. consultation_notes (상담 기록)

- **역할**: 상담사가 작성한 상담 메모
- **특징**:
  - 예약별로 하나의 상담 기록 작성 가능
  - 한 슬롯에 여러 예약이 있으면 각 예약마다 별도의 상담 기록 가능
- **관계**:
  - `1:1` → `reservations` (기록은 한 예약에 속함)
  - `N:1` → `slots` (여러 상담 기록이 한 슬롯에 속함)

## 주요 제약조건

1. **중복 예약 방지**: `reservations(slot_id, email) UNIQUE` - 같은 슬롯에 같은 이메일로 중복 예약 불가
2. **슬롯당 최대 3명**: `slots.capacity = 3` (기본값)
   - `slots.booked_count`로 현재 예약 수 추적 (동시성 제어용)
   - `status = 'BOOKED'`인 예약만 카운트하여 capacity 체크
   - `CANCELLED`, `COMPLETED` 상태는 capacity에 포함되지 않음
3. **CHECK 제약조건**:
   - `slots_booked_count_range`: `booked_count >= 0 AND booked_count <= capacity` (필수)
   - `slots_capacity_positive`: `capacity > 0` (권장)
4. **동시성 처리**: 트랜잭션 + 원자적 `UPDATE`로 `booked_count` 관리 (자세한 내용은 [DB_DESIGN.md](./DB_DESIGN.md) 참조)
5. **슬롯 시간 검증**: `startAt < endAt` (애플리케이션 레벨에서 검증)

## 인덱스

### 일반 인덱스

- `slots(counselor_id, start_at)`: 상담사별 날짜별 슬롯 조회 최적화
- `consultation_notes(slot_id)`: 슬롯별 상담 기록 조회 최적화
- `invite_tokens(expires_at)`: 만료된 초대 토큰 정리 쿼리 최적화
- `reservation_tokens(expires_at)`: 만료된 예약 관리 토큰 정리 쿼리 최적화

### UNIQUE 인덱스 (제약조건으로 자동 생성)

- `counselors(email)`: 이메일로 상담사 조회
- `counselors(google_sub)`: Google OAuth sub로 상담사 조회
- `reservations(slot_id, email)`: 중복 예약 방지
- `invite_tokens(token)`: 토큰으로 초대 정보 조회
- `reservation_tokens(token)`: 토큰으로 예약 정보 조회
- `reservation_tokens(reservation_id)`: 예약당 하나의 토큰 보장
- `consultation_notes(reservation_id)`: 예약당 하나의 상담 기록 보장

### Partial Index (PostgreSQL)

- `reservations(slot_id, created_at) WHERE status='BOOKED'`: BOOKED 상태 예약만 인덱싱하여 capacity 체크 및 정렬 쿼리 최적화
