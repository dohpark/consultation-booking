# 상담예약 시스템 설계 문서

**작성일**: 2025-01-16  
**버전**: 1.0  
**프로젝트명**: Consultation Booking System

---

## 문서 개요

본 문서는 상담예약 시스템의 설계를 설명하는 문서입니다.

**구현 상태:**

- ✅ **개발 환경**: Docker 기반 개발 환경 구성 (구현 완료)
- ✅ **애플리케이션**: 백엔드 API, 프론트엔드 (구현 완료)
- ✅ **데이터베이스**: PostgreSQL 스키마 및 마이그레이션 (구현 완료)
- ⚠️ **프로덕션 배포**: AWS 인프라 배포는 설계 단계이며, 아직 구현되지 않음

본 문서에서 AWS 관련 내용(6.2, 6.3 섹션)은 프로덕션 배포를 위한 설계/계획이며, 실제 구현은 진행되지 않았습니다.

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [시스템 아키텍처 설계](#2-시스템-아키텍처-설계)
3. [동시성 제어 및 트랜잭션](#3-동시성-제어-및-트랜잭션)
4. [데이터베이스 설계](#4-데이터베이스-설계)
5. [보안 설계](#5-보안-설계)
6. [개발 환경 및 배포](#6-개발-환경-및-배포)
7. [설계 의사결정 요약](#7-설계-의사결정-요약)

---

## 1. 시스템 개요

### 1.1 프로젝트 목적

상담사가 스케줄을 등록하고, 이메일 링크를 통해 신청자가 예약할 수 있는 시스템입니다. 동시에 최대 3명까지 예약이 가능하며, 상담 진행 및 이력 관리 기능을 제공합니다.

### 1.2 주요 요구사항

- **기본 프로세스**: 상담사 스케줄 설정 → 이메일 링크 발송 → 신청자 예약 신청 → 상담 진행 및 이력 관리
- **동시성 처리**: 동시간대 최대 3명 예약 가능, 동시 예약 시도 처리 필요
- **유지보수성**: 확장 가능하고 유지보수가 용이한 구조
- **애플리케이션 구성**:
  - 상담사 페이지 (관리자 화면)
  - 비즈니스 로직 처리 (백엔드 API)
  - 상담 예약 페이지 (신청자 화면)

### 1.3 기술 스택

#### 프론트엔드

- **React** + **TypeScript**: 컴포넌트 기반 UI 개발
- **TailwindCSS**: 유틸리티 기반 스타일링
- **Vite**: 빠른 개발 환경 및 빌드 도구

#### 백엔드

- **NestJS** + **TypeScript**: 엔터프라이즈급 Node.js 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **Prisma**: ORM (Object-Relational Mapping)
- **Passport.js**: 인증 미들웨어 (JWT 전략)

#### 인프라

- **Docker**: 컨테이너화
- **AWS ECS Fargate**: 컨테이너 오케스트레이션 (프로덕션 예상)
- **AWS RDS PostgreSQL**: 관리형 데이터베이스 (프로덕션 예상)
- **AWS S3 + CloudFront**: 정적 파일 호스팅 및 CDN (프로덕션 예상)

---

## 2. 시스템 아키텍처 설계

### 2.1 전체 시스템 구조도

> **참고**: 아래 구조도는 프로덕션 환경 배포를 위한 설계입니다. 현재는 개발 환경(Docker Compose)만 구현되어 있으며, AWS 인프라는 설계 단계입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────┬───────────────────────────────────┤
│   Admin Frontend        │     Applicant Frontend            │
│   (React + Vite)        │     (React + Vite)                │
│   Port: 5173            │     Port: 5174                    │
└───────────┬─────────────┴───────────────┬───────────────────┘
            │                             │
            │ HTTP/HTTPS                  │ HTTP/HTTPS
            │ (with JWT Cookie)           │ (with Token)
            │                             │
┌───────────▼─────────────────────────────▼───────────────────┐
│                    API Gateway / Load Balancer              │
│                    (AWS ALB / CloudFront)                   │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            │                             │
┌───────────▼─────────────────────────────▼───────────────────┐
│                      Backend Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │           NestJS Application Server                │     │
│  │  Port: 3002                                        │     │
│  │                                                    │     │
│  │  ┌──────────────┐  ┌──────────────┐                │     │
│  │  │   Controller │  │   Controller │                │     │
│  │  │   (Public)   │  │   (Admin)    │                │     │
│  │  └──────┬───────┘  └──────┬───────┘                │     │
│  │         │                  │                       │     │
│  │  ┌──────▼──────────────────▼───────┐               │     │
│  │  │        Service Layer            │               │     │
│  │  │  (Business Logic)               │               │     │
│  │  └──────┬──────────────────┬───────┘               │     │
│  │         │                  │                       │     │
│  │  ┌──────▼──────────────────▼───────┐               │     │
│  │  │      Repository Layer           │               │     │
│  │  │  (Data Access)                  │               │     │
│  │  └──────┬──────────────────┬───────┘               │     │
│  └─────────┼──────────────────┼───────────────────────┘     │
│            │                  │                             │
└────────────┼──────────────────┼─────────────────────────────┘
             │                  │
             │   Prisma ORM     │
             │                  │
┌────────────▼──────────────────▼─────────────────────────────┐
│                    Database Layer                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │         PostgreSQL (AWS RDS)                       │     │
│  │  - counselors                                      │     │
│  │  - slots                                           │     │
│  │  - reservations                                    │     │
│  │  - invite_tokens                                   │     │
│  │  - reservation_tokens                              │     │
│  │  - consultation_notes                              │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 아키텍처 패턴: 계층형 아키텍처 (Layered Architecture)

본 시스템은 **Controller-Service-Repository 패턴**을 채택하여 계층별 책임을 명확히 분리했습니다.

```
┌──────────────────────────────────────┐
│         Controller Layer             │
│  - HTTP 요청/응답 처리                  │
│  - 입력 검증 (DTO)                     │
│  - 라우팅                              │
│  - 인증/인가 (Guards)                  │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│         Service Layer                │
│  - 비즈니스 로직 처리                    │
│  - 트랜잭션 관리                        │
│  - 도메인 규칙 검증                      │
│  - 외부 서비스 연동                      │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│      Repository Layer                │
│  - 데이터 접근 로직                      │
│  - ORM 쿼리 실행                       │
│  - 데이터 매핑                          │
│  - 트랜잭션 세부 구현                    │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│         Database Layer               │
│  - PostgreSQL                        │
│  - 데이터 영속성                        │
└──────────────────────────────────────┘
```

#### 2.2.1 계층별 책임

**Controller Layer**

- HTTP 요청/응답 처리
- 요청 데이터 검증 (class-validator를 통한 DTO 검증)
- 인증/인가 처리 (Guards 사용)
- 에러 핸들링 및 응답 변환

**Service Layer**

- 비즈니스 로직의 중심
- 여러 Repository 조합하여 복잡한 비즈니스 로직 구현
- 트랜잭션 경계 결정 (필요 시 Repository에 위임)
- 도메인 규칙 검증 (예: capacity 체크, 상태 전이 규칙)

**Repository Layer**

- 데이터베이스 접근 로직 캡슐화
- Prisma ORM을 사용한 쿼리 실행
- 트랜잭션 세부 구현 ($transaction 사용)
- 원자적 연산 처리 (예: booked_count 증가)

### 2.2 모듈 구조

NestJS의 모듈 시스템을 활용하여 도메인별로 모듈을 분리했습니다.

```
AppModule
├── AuthModule          # 인증/인가
├── SlotsModule         # 슬롯 관리
├── ReservationsModule  # 예약 관리
├── InvitationsModule   # 초대 링크 관리
├── ConsultationNotesModule  # 상담 기록
├── PrismaModule        # 데이터베이스 연결
└── MailModule          # 이메일 발송
```

**모듈 분리 전략:**

- **도메인 중심 분리**: 각 비즈니스 도메인별로 모듈 분리
- **응집도 최대화**: 관련된 Controller, Service, Repository를 같은 모듈에 배치
- **결합도 최소화**: 모듈 간 의존성을 최소화 (필요시에만 import)

---

## 3. 동시성 제어 및 트랜잭션

### 3.1 문제 상황

동시에 여러 사용자가 같은 슬롯에 예약을 시도할 경우, 다음과 같은 동시성 문제가 발생할 수 있습니다:

1. **Race Condition**: 여러 요청이 동시에 `booked_count`를 읽고 업데이트할 경우, 실제 예약 수가 capacity를 초과할 수 있음
2. **Lost Update**: 마지막에 쓰기한 요청만 반영되어 중간 업데이트가 손실될 수 있음

### 3.2 해결 방안: Booked Count + 원자적 UPDATE

#### 3.2.1 설계 원칙

**핵심 아이디어**: `slots.booked_count` 필드를 사용하여 현재 예약 수를 추적하고, 원자적 UPDATE를 통해 동시성을 보장합니다.

```sql
-- 예약 생성 시 좌석 확보 (원자적 UPDATE)
UPDATE slots
SET booked_count = booked_count + 1
WHERE id = ? AND booked_count < capacity
RETURNING id;
```

#### 3.2.2 구현 상세

**1. 예약 생성 로직 (트랜잭션)**

```typescript
async createReservationWithLock(data: {
  slotId: string;
  email: string;
  name: string;
  note?: string;
}): Promise<Reservation> {
  return this.prisma.$transaction(async tx => {
    // 1. 좌석 확보 (원자적 UPDATE)
    const updateResult = await tx.$executeRaw`
      UPDATE slots
      SET booked_count = booked_count + 1
      WHERE id = ${data.slotId}
        AND booked_count < capacity
    `;

    // 2. UPDATE 결과 확인
    if (updateResult === 0) {
      // 슬롯 재조회하여 에러 구분
      const slot = await tx.slot.findUnique({
        where: { id: data.slotId },
        select: { id: true, capacity: true, bookedCount: true },
      });

      if (!slot) throw new Error('SLOT_NOT_FOUND');
      if (slot.bookedCount >= slot.capacity) throw new Error('SLOT_FULL');
      throw new Error('SLOT_UPDATE_FAILED');
    }

    // 3. 예약 생성
    try {
      const reservation = await tx.reservation.create({
        data: {
          slotId: data.slotId,
          email: data.email,
          name: data.name,
          note: data.note,
          status: 'BOOKED',
        },
      });
      return reservation;
    } catch (error) {
      // UNIQUE 제약조건 위반 시 (중복 예약)
      // 트랜잭션이 롤백되므로 booked_count도 자동으로 복구됨
      if (error.code === 'P2002') throw new Error('DUPLICATE_RESERVATION');
      throw error;
    }
  });
}
```

**2. 상태 전이 로직 (멱등성 보장)**

```typescript
async transitionStatus(reservationId: string, newStatus: ReservationStatus) {
  return this.prisma.$transaction(async tx => {
    // 1. 상태 전이 (WHERE status='BOOKED' 조건으로 멱등성 보장)
    const updateResult = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: 'BOOKED',  // BOOKED 상태인 경우에만 업데이트
      },
      data: { status: newStatus, cancelledAt: newStatus === 'CANCELLED' ? new Date() : undefined },
    });

    // 2. 성공 시에만 booked_count 감소
    if (updateResult.count > 0) {
      await tx.$executeRaw`
        UPDATE slots
        SET booked_count = booked_count - 1
        WHERE id IN (
          SELECT slot_id FROM reservations WHERE id = ${reservationId}
        )
        AND booked_count > 0  -- 방어적 체크
      `;
    }

    // 3. 업데이트된 예약 반환
    return tx.reservation.findUnique({ where: { id: reservationId } });
  });
}
```

### 3.3 대안 방식 비교 및 Trade-off

| 항목              | Booked Count + 원자적 UPDATE ⭐     | 트랜잭션 + SELECT FOR UPDATE | Seat Number 방식                        |
| ----------------- | ----------------------------------- | ---------------------------- | --------------------------------------- |
| **스키마 복잡도** | 중간 (booked_count 필드 추가)       | 낮음 ✅                      | 높음 ❌ (seat_number 필드, UNIQUE 제약) |
| **구현 복잡도**   | 낮음 ✅                             | 높음 (FOR UPDATE 락 필요)    | 낮음 ✅                                 |
| **동시성 처리**   | 원자적 UPDATE로 자동 처리 ✅        | 명시적 락 필요               | DB 제약조건으로 자동 처리 ✅            |
| **성능**          | COUNT(\*) 불필요 ✅                 | COUNT(\*) 오버헤드           | 제약조건 체크 오버헤드                  |
| **Prisma 호환성** | Raw Query 필요 (간단)               | Raw Query 필요 (복잡)        | Prisma 직접 지원 ✅                     |
| **유연성**        | 높음 (슬롯별 capacity 변경 용이) ✅ | 높음 ✅                      | 낮음 (고정된 좌석 수)                   |
| **락 경합**       | 낮음 (UPDATE row-lock) ✅           | 높음 (SELECT FOR UPDATE)     | 없음 ✅                                 |
| **정합성 보장**   | CHECK 제약 + 리콘실 배치 필요       | 자동 (COUNT 기반)            | 자동 (DB 제약)                          |

**최종 결정: Booked Count + 원자적 UPDATE**

**선택 이유:**

1. **원자적 처리 보장**: PostgreSQL의 UPDATE 문이 원자적으로 실행되어 동시성 안전 보장
2. **성능 우수**: COUNT(\*) 쿼리 불필요하여 부하 감소
3. **구현 단순**: 복잡한 SELECT FOR UPDATE 락 로직 불필요
4. **PostgreSQL 최적화**: PostgreSQL의 row-level locking을 효율적으로 활용
5. **확장성**: 슬롯별로 다른 capacity 설정 가능

**Trade-off:**

- `booked_count`는 파생 컬럼이므로 정합성 보장을 위해 CHECK 제약조건과 주기적 리콘실 배치 필요
- 하지만 이는 운영상 관리 가능한 수준의 오버헤드이며, 성능과 복잡도 측면에서 얻는 이점이 더 큼

### 3.4 트랜잭션 전략

#### 3.4.1 트랜잭션 경계

**원칙**: 하나의 비즈니스 로직 단위는 하나의 트랜잭션으로 처리

**예약 생성 트랜잭션:**

```
BEGIN
  UPDATE slots SET booked_count = booked_count + 1 WHERE ...
  INSERT INTO reservations ...
COMMIT (또는 ROLLBACK)
```

**상태 전이 트랜잭션:**

```
BEGIN
  UPDATE reservations SET status = ... WHERE status = 'BOOKED'
  UPDATE slots SET booked_count = booked_count - 1 WHERE ...
COMMIT
```

#### 3.4.2 트랜잭션 격리 수준

PostgreSQL의 기본 격리 수준인 **READ COMMITTED**를 사용합니다.

**선택 근거:**

- **충분한 동시성 보장**: 원자적 UPDATE를 사용하므로 더 높은 격리 수준 불필요
- **성능**: READ COMMITTED는 락 경합이 적어 성능이 우수
- **PostgreSQL 기본값**: 기본 설정을 사용하여 복잡도 감소

### 3.5 정합성 보강

`booked_count`는 파생 컬럼이므로, 애플리케이션 버그나 예외 상황에서 정합성이 깨질 수 있습니다. 이를 방지하기 위해 다음 조치를 취합니다:

**1. CHECK 제약조건**

```sql
ALTER TABLE slots
ADD CONSTRAINT slots_booked_count_range
CHECK (booked_count >= 0 AND booked_count <= capacity);
```

**2. 주기적 리콘실 배치 (일 1회)**

```sql
UPDATE slots
SET booked_count = (
  SELECT COUNT(*)
  FROM reservations
  WHERE reservations.slot_id = slots.id
    AND reservations.status = 'BOOKED'
);
```

---

## 4. 데이터베이스 설계

### 4.1 ERD (Entity Relationship Diagram)

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
│ end_at          │         │ client_email    │
│ capacity (3)    │         │ expires_at      │
│ booked_count (0)│         │ created_at      │
│ created_at      │         └─────────────────┘
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

### 4.2 테이블 상세 설계

#### 4.2.1 counselors (상담사)

```sql
CREATE TABLE counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  google_sub VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**설계 의사결정:**

- **UUID 사용**: 분산 환경에서 ID 충돌 방지, 보안성 향상 (순차적 ID 노출 방지)
- **google_sub UNIQUE**: Google OAuth 인증 시 상담사 식별

#### 4.2.2 slots (상담 슬롯)

```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  capacity INT DEFAULT 3 CHECK (capacity > 0),
  booked_count INT DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= capacity),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_slots_counselor_start (counselor_id, start_at)
);
```

**핵심 필드:**

- **capacity**: 최대 예약 가능 인원 수 (기본값 3)
- **booked_count**: 현재 예약 수 (동시성 제어용)
- **CHECK 제약조건**: 데이터 정합성 보장

#### 4.2.3 reservations (예약)

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  note TEXT,
  status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CANCELLED', 'COMPLETED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,

  UNIQUE(slot_id, email),  -- 중복 예약 방지
  INDEX idx_reservations_email_created (email, created_at DESC),
  INDEX idx_reservations_slot_booked (slot_id, created_at) WHERE status = 'BOOKED'  -- Partial Index
);
```

**핵심 제약조건:**

- **UNIQUE(slot_id, email)**: 같은 슬롯에 같은 이메일로 중복 예약 방지
- **Partial Index**: BOOKED 상태 예약만 인덱싱하여 capacity 체크 쿼리 최적화

#### 4.2.4 invite_tokens (초대 토큰)

```sql
CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_invite_tokens_expires (expires_at),
  INDEX idx_invite_tokens_client_email (client_email)
);
```

**설계 의사결정:**

- **client_email 필수**: 토큰을 받은 특정 신청자만 예약 가능하도록 제한
- **만료 시간 관리**: 인덱스를 통한 효율적인 만료 토큰 정리

#### 4.2.5 reservation_tokens (예약 관리 토큰)

```sql
CREATE TABLE reservation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID UNIQUE NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_reservation_tokens_expires (expires_at)
);
```

**설계 의사결정:**

- **예약당 하나의 토큰**: 1:1 관계로 예약 취소 권한 관리
- **토큰 만료 관리**: 만료 시간을 통한 취소 권한 제한

#### 4.2.6 consultation_notes (상담 기록)

```sql
CREATE TABLE consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID UNIQUE NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_consultation_notes_slot (slot_id)
);
```

**설계 의사결정:**

- **예약당 하나의 기록**: 1:1 관계로 예약별 상담 내용 관리
- **slot_id 중복 저장**: 슬롯별 조회 성능 최적화 (정규화 위반이지만 성능 이점)

### 4.3 인덱스 전략

#### 4.3.1 일반 인덱스

| 인덱스                                                    | 목적                      | 쿼리 패턴                                                     |
| --------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| `slots(counselor_id, start_at)`                           | 상담사별 날짜별 슬롯 조회 | `WHERE counselor_id = ? AND start_at >= ? AND start_at < ?`   |
| `reservations(email, created_at DESC)`                    | 이메일별 예약 내역 조회   | `WHERE email = ? ORDER BY created_at DESC`                    |
| `reservations(slot_id, created_at) WHERE status='BOOKED'` | 슬롯별 BOOKED 예약 조회   | `WHERE slot_id = ? AND status = 'BOOKED' ORDER BY created_at` |
| `invite_tokens(expires_at)`                               | 만료 토큰 정리            | `WHERE expires_at < NOW()`                                    |
| `reservation_tokens(expires_at)`                          | 만료 토큰 정리            | `WHERE expires_at < NOW()`                                    |

#### 4.3.2 Partial Index (PostgreSQL)

```sql
CREATE INDEX reservations_booked_by_slot_created
ON reservations(slot_id, created_at)
WHERE status = 'BOOKED';
```

**선택 근거:**

- **저장 공간 절약**: BOOKED 상태 예약만 인덱싱
- **쿼리 성능 향상**: capacity 체크 시 BOOKED 상태만 조회하므로 인덱스 크기 감소

#### 4.3.3 인덱스 설계 Trade-off

| 전략                         | 장점                           | 단점                           | 선택 여부 |
| ---------------------------- | ------------------------------ | ------------------------------ | --------- |
| **모든 컬럼 인덱싱**         | 조회 성능 최적화               | 저장 공간 증가, 쓰기 성능 저하 | ❌        |
| **필수 인덱스만**            | 저장 공간 절약, 쓰기 성능 우수 | 조회 성능 저하 가능            | ❌        |
| **쿼리 패턴 기반 인덱싱** ⭐ | 성능과 공간의 균형             | 설계 시 쿼리 패턴 분석 필요    | ✅        |

**최종 결정: 쿼리 패턴 기반 인덱싱**

실제 사용되는 쿼리 패턴을 분석하여 필요한 인덱스만 생성하여 성능과 저장 공간의 균형을 맞췄습니다.

### 4.4 쿼리 최적화 고려사항

#### 4.4.1 N+1 문제 방지

**문제 상황:**

```typescript
// 나쁜 예: N+1 쿼리
const slots = await prisma.slot.findMany();
for (const slot of slots) {
  const reservations = await prisma.reservation.findMany({
    where: { slotId: slot.id },
  });
}
```

**해결 방법:**

```typescript
// 좋은 예: JOIN 또는 include 사용
const slots = await prisma.slot.findMany({
  include: {
    reservations: true,
  },
});
```

#### 4.4.2 페이징 처리

대량의 데이터를 조회할 때는 페이징을 적용하여 메모리 사용량과 응답 시간을 최적화합니다.

```typescript
const reservations = await prisma.reservation.findMany({
  where: { email: 'user@example.com' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

#### 4.4.3 배치 처리

여러 슬롯을 생성할 때는 배치 INSERT를 사용하여 성능을 향상시킵니다.

```typescript
await prisma.slot.createMany({
  data: slots.map(slot => ({
    counselorId: slot.counselorId,
    startAt: slot.startAt,
    endAt: slot.endAt,
    capacity: 3,
  })),
});
```

---

## 5. 보안 설계

### 5.1 인증 구조: JWT (JSON Web Token)

#### 5.1.1 인증 흐름

**상담사 (Admin) 인증:**

```
1. Google OAuth 로그인
   ┌─────────┐         ┌──────────┐         ┌─────────┐
   │ Client  │────────>│  Google  │────────>│ Backend │
   └─────────┘         └──────────┘         └─────────┘
                              │                   │
                              │                   │ (1) Google ID Token 검증
                              │                   │ (2) Counselor 조회/생성
                              │                   │ (3) JWT 발급
                              │<──────────────────│
                              │                   │
                              │                   │
   ┌─────────┐<───────────────┴──────────────────┘
   │ Client  │  JWT (HTTP-only Cookie)
   └─────────┘
```

**신청자 (Applicant) 인증:**

```
1. 초대 링크 접근 (Token 기반)
   ┌─────────┐         ┌─────────┐
   │ Client  │────────>│ Backend │
   └─────────┘         └─────────┘
         │                   │
         │  /api/invitations/validate?token=xxx
         │                   │
         │<──────────────────│ Token 유효성 확인
         │                   │
         │  예약 생성 시 Token 검증
         │                   │
```

#### 5.1.2 JWT 구조

**JWT Payload:**

```json
{
  "sub": "google-oauth-sub",
  "email": "counselor@example.com",
  "name": "상담사 이름",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**JWT 설정:**

- **알고리즘**: HS256 (HMAC-SHA256)
- **만료 시간**: 7일 (환경 변수로 설정 가능)
- **저장 위치**: HTTP-only Cookie (XSS 공격 방지)

#### 5.1.3 JWT 구현

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더
        (request: Request) => request.cookies?.access_token, // Cookie
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const counselor = await this.prisma.counselor.findUnique({
      where: { googleSub: payload.sub },
    });
    if (!counselor) {
      throw new UnauthorizedException();
    }
    return { userId: counselor.id, email: counselor.email, name: counselor.name };
  }
}
```

#### 5.1.4 JWT vs Session 비교

| 항목          | JWT ⭐                                 | Session                      |
| ------------- | -------------------------------------- | ---------------------------- |
| **상태 관리** | Stateless (서버에 세션 저장 불필요) ✅ | Stateful (서버에 세션 저장)  |
| **확장성**    | 높음 (서버 확장 용이) ✅               | 낮음 (세션 공유 필요)        |
| **성능**      | 높음 (DB 조회 불필요) ✅               | 중간 (세션 저장소 조회)      |
| **취소**      | 어려움 (만료 시간까지 유효)            | 쉬움 (세션 삭제)             |
| **보안**      | 토큰 탈취 시 만료까지 유효 ❌          | 서버에서 즉시 무효화 가능 ✅ |

**최종 결정: JWT**

**선택 이유:**

1. **Stateless**: 서버 확장 시 세션 공유 문제 없음
2. **성능**: 매 요청마다 DB 조회 불필요
3. **마이크로서비스 친화적**: 여러 서비스 간 인증 정보 공유 용이

**Trade-off:**

- 토큰 탈취 시 만료 시간까지 유효 (완화 방법: 짧은 만료 시간 + Refresh Token)
- 하지만 본 시스템은 민감한 정보가 적고, HTTP-only Cookie 사용으로 XSS 공격 위험 감소

### 5.2 권한 관리 (RBAC: Role-Based Access Control)

#### 5.2.1 역할 구분

| 역할                   | 설명                                      | 인증 방식                                    |
| ---------------------- | ----------------------------------------- | -------------------------------------------- |
| **Admin (상담사)**     | 슬롯 관리, 예약 내역 조회, 상담 기록 작성 | Google OAuth + JWT                           |
| **Applicant (신청자)** | 예약 생성, 예약 취소                      | Token 기반 (Invite Token, Reservation Token) |

#### 5.2.2 Guard 구현

**AdminRoleGuard:**

```typescript
@Injectable()
export class AdminRoleGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isJwtValid = await super.canActivate(context);
    if (!isJwtValid) return false;

    const request = context.switchToHttp().getRequest<Request & { user?: CurrentUser }>();
    const user = request.user;

    // JWT가 있으면 Admin으로 간주 (Google OAuth 사용자는 모두 Admin)
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    return true;
  }
}
```

**적용 예시:**

```typescript
@Controller('admin/slots')
@UseGuards(AdminRoleGuard) // Admin 전용 API
export class AdminSlotsController {
  // ...
}
```

#### 5.2.3 권한 관리 확장성

현재는 Google OAuth 사용자를 모두 Admin으로 간주하지만, 향후 확장 가능한 구조로 설계했습니다:

```typescript
// 향후 확장 시 (role 필드 추가)
if (user.role !== 'admin') {
  throw new ForbiddenException('Admin access required');
}
```

### 5.3 입력값 검증

#### 5.3.1 DTO (Data Transfer Object) 검증

NestJS의 `class-validator`를 사용하여 입력값을 검증합니다.

```typescript
export class CreateReservationDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '토큰은 필수입니다.' })
  token: string;

  @IsString({ message: '슬롯 ID는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '슬롯 ID는 필수입니다.' })
  slotId: string;

  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email?: string;

  @IsOptional()
  @IsString({ message: '메모는 문자열이어야 합니다.' })
  note?: string;
}
```

#### 5.3.2 Global Validation Pipe

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성 있으면 에러
    transform: true, // 자동 타입 변환
  }),
);
```

**설정 설명:**

- **whitelist**: DTO에 정의되지 않은 속성은 자동으로 제거 (예: `{ name: 'John', maliciousField: 'attack' }` → `{ name: 'John' }`)
- **forbidNonWhitelisted**: 예상치 못한 속성이 있으면 400 에러 반환
- **transform**: 문자열로 받은 숫자/불린 등을 자동으로 타입 변환

### 5.4 SQL Injection 방어

#### 5.4.1 Prisma ORM 사용

Prisma ORM은 Prepared Statement를 사용하여 SQL Injection을 자동으로 방어합니다.

```typescript
// 안전: Prisma가 Prepared Statement로 변환
const slot = await prisma.slot.findUnique({
  where: { id: slotId }, // slotId가 자동으로 이스케이프됨
});
```

#### 5.4.2 Raw Query 사용 시 주의사항

Raw Query를 사용할 때는 Prisma의 템플릿 리터럴을 사용하여 SQL Injection을 방어합니다.

```typescript
// 안전: Prisma의 템플릿 리터럴 사용 (파라미터 바인딩)
await tx.$executeRaw`
  UPDATE slots
  SET booked_count = booked_count + 1
  WHERE id = ${data.slotId}  -- 자동으로 이스케이프됨
`;

// 위험: 문자열 연결 사용 금지
await tx.$executeRawUnsafe(
  `UPDATE slots SET booked_count = booked_count + 1 WHERE id = '${slotId}'`, // ❌ SQL Injection 위험
);
```

### 5.5 기타 보안 고려사항

#### 5.5.1 CORS 설정

```typescript
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.APPLICANT_FRONTEND_URL || 'http://localhost:5174',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cookie 전송 허용
});
```

#### 5.5.2 환경 변수 관리

민감한 정보는 환경 변수로 관리하며, 프로덕션 환경 설계에서는 AWS Secrets Manager 등을 사용하도록 계획되어 있습니다.

```typescript
// .env (로컬 개발)
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/db

// AWS Secrets Manager (프로덕션)
// 환경 변수로 주입받아 사용
```

#### 5.5.3 에러 메시지 노출 최소화

프로덕션 환경에서는 상세한 에러 메시지를 노출하지 않도록 처리합니다.

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Internal server error'
      : exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    // ...
  }
}
```

---

## 6. 개발 환경 및 배포

> **참고**: 본 섹션에서 Docker 개발 환경(6.1)은 실제 구현되었으며, 프로덕션 배포 관련 내용(6.2, 6.3)은 설계 단계입니다.

### 6.1 Docker 기반 개발 환경 구성

#### 6.1.1 Docker Compose 개발 환경

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: consultation-booking-db-dev
    environment:
      POSTGRES_USER: consultation_user
      POSTGRES_PASSWORD: consultation_pass
      POSTGRES_DB: consultation_booking_dev
    ports:
      - '5433:5432'
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile.dev
    container_name: consultation-booking-server-dev
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://consultation_user:consultation_pass@postgres:5432/consultation_booking_dev
    volumes:
      - ./apps/server/src:/app/apps/server/src # Hot Reload
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "cd /app/apps/server && pnpm prisma generate && pnpm start:dev"
```

**개발 환경 특징:**

- **Hot Reload**: 소스 코드 변경 시 자동 재시작
- **데이터 영속성**: 볼륨을 통한 데이터 저장
- **네트워크 격리**: Docker 네트워크를 통한 서비스 간 통신

#### 6.1.2 Dockerfile (프로덕션 빌드용 설계)

> **참고**: 아래 Dockerfile은 프로덕션 배포를 위한 설계이며, 실제 프로덕션 환경 배포는 아직 진행되지 않았습니다.

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@8.15.0

# 의존성 설치
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

# 빌드
COPY apps/server ./apps/server
WORKDIR /app/apps/server
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g pnpm@8.15.0

# 프로덕션 의존성만 설치
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile --prod --filter server

# 빌드 결과물 복사
COPY --from=builder /app/apps/server/dist ./apps/server/dist

WORKDIR /app/apps/server
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
```

**Dockerfile 설계 의사결정:**

| 전략                     | 장점                               | 단점                        | 선택 여부 |
| ------------------------ | ---------------------------------- | --------------------------- | --------- |
| **Multi-stage Build** ⭐ | 이미지 크기 최소화, 빌드 도구 제거 | 빌드 시간 증가              | ✅        |
| **Single-stage Build**   | 빌드 단순                          | 이미지 크기 증가, 보안 위험 | ❌        |

**설계 결정: Multi-stage Build**

> **참고**: 프로덕션 배포를 위한 Dockerfile 설계입니다.

- **이미지 크기 최소화**: 빌드 도구(컴파일러, 빌드 의존성)가 최종 이미지에 포함되지 않도록 설계
- **보안 향상**: 최소한의 런타임만 포함하여 공격 표면 감소
- **배포 속도**: 작은 이미지로 빠른 배포 및 다운로드 예상

### 6.2 배포 시나리오 설계: AWS 기반 배포 (프로덕션 설계)

> **참고**: 본 섹션은 프로덕션 환경 배포를 위한 설계/계획이며, 실제로는 아직 구현되지 않았습니다.

#### 6.2.1 예상 인프라 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud                              │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │              CloudFront (CDN)                      │     │
│  │  - 정적 파일 (Admin Frontend, Applicant Frontend)     │    │
│  └────────────────────────────────────────────────────┘     │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Application Load Balancer (ALB)            │    │
│  │  - HTTPS 종료                                        │    │
│  │  - 라우팅 (API 요청 → ECS)                             │    │
│  └────────────┬─────────────────────┬──────────────────┘    │
│               │                     │                       │
│               │                     │                       │
│               ▼                     ▼                       │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │   ECS Fargate      │  │   ECS Fargate      │             │
│  │   (Backend API)    │  │   (Backend API)    │             │
│  │   - Task 1         │  │   - Task 2         │             │
│  │   - Task 2         │  │   - Task 3         │             │
│  └─────────┬──────────┘  └─────────┬──────────┘             │
│            │                       │                        │
│            └───────────┬───────────┘                        │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │         RDS PostgreSQL (Multi-AZ)                  │     │
│  │  - 자동 백업                                         │     │
│  │  - 읽기 전용 복제본 (선택)                              │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Secrets Manager                            │     │
│  │  - JWT_SECRET                                      │     │
│  │  - DATABASE_URL                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │         S3 Bucket                                  │     │
│  │  - 빌드 아티팩트 저장                                   │    │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2.2 설계된 배포 프로세스

> **참고**: 아래 내용은 프로덕션 배포를 위한 설계된 프로세스이며, 실제 구현은 아직 진행되지 않았습니다.

**1. 프론트엔드 배포 설계 (S3 + CloudFront)**

```bash
# 1. 빌드
cd apps/admin && npm run build
cd apps/applicant && npm run build

# 2. S3 업로드
aws s3 sync apps/admin/dist s3://consultation-booking-admin
aws s3 sync apps/applicant/dist s3://consultation-booking-applicant

# 3. CloudFront 무효화
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

**2. 백엔드 배포 설계 (ECS Fargate)**

```bash
# 1. Docker 이미지 빌드 및 ECR 푸시
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <ECR_URI>
docker build -t consultation-booking-server -f apps/server/Dockerfile .
docker tag consultation-booking-server:latest <ECR_URI>/consultation-booking-server:latest
docker push <ECR_URI>/consultation-booking-server:latest

# 2. ECS 서비스 업데이트 (새 태스크 정의 생성 및 배포)
aws ecs update-service --cluster consultation-booking-cluster --service consultation-booking-service --force-new-deployment
```

**3. 데이터베이스 배포 설계 (RDS)**

```bash
# 1. 마이그레이션 실행 (ECS Task 또는 별도 서버에서)
cd apps/server
pnpm prisma migrate deploy
```

#### 6.2.3 배포 전략 설계 및 비교

> **참고**: 아래 내용은 프로덕션 배포 전략 설계입니다.

| 전략                  | 장점                            | 단점            | 설계 선택 여부 |
| --------------------- | ------------------------------- | --------------- | -------------- |
| **Blue-Green**        | 무중단 배포, 빠른 롤백          | 인프라 비용 2배 | ❌ (초기 단계) |
| **Rolling Update** ⭐ | 비용 효율적, 점진적 배포        | 배포 시간 증가  | ✅ (설계)      |
| **Canary**            | 위험 최소화, 점진적 트래픽 증가 | 복잡도 높음     | ❌ (초기 단계) |

**설계 결정: Rolling Update (ECS 기본 전략)**

> **참고**: 프로덕션 배포 시 ECS의 Rolling Update 전략을 사용하도록 설계했습니다.

- **비용 효율적**: Blue-Green에 비해 인프라 비용 절감
- **ECS 기본 지원**: ECS가 자동으로 Rolling Update 수행
- **적절한 복잡도**: Canary보다 구현 단순

#### 6.2.4 모니터링 및 로깅 설계

> **참고**: 아래 내용은 프로덕션 환경 모니터링을 위한 설계입니다.

**예상 AWS CloudWatch 통합:**

- **로그 집계**: ECS Task의 로그를 CloudWatch Logs로 자동 전송
- **메트릭 수집**: CPU, 메모리 사용량 모니터링
- **알람 설정**: 에러율, 응답 시간 임계값 초과 시 알림

**Health Check 설계:**

```typescript
// GET /api/health (이미 구현됨)
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

> **참고**: Health Check 엔드포인트는 이미 구현되어 있으며, 프로덕션 환경에서는 이를 활용하여 모니터링할 수 있도록 설계했습니다.

#### 6.2.5 비용 최적화 설계

> **참고**: 아래 내용은 프로덕션 환경 비용 최적화를 위한 설계입니다.

| 항목            | 설계 전략                                                   | 예상 비용 절감 효과     |
| --------------- | ----------------------------------------------------------- | ----------------------- |
| **ECS Fargate** | 오토스케일링 설계 (최소 1, 최대 3 Task)                     | 트래픽에 따른 자동 조정 |
| **RDS**         | Multi-AZ 비활성화 (개발), Reserved Instance 설계 (프로덕션) | 예상 30-50% 절감        |
| **CloudFront**  | 캐싱 최적화, 압축 활성화 설계                               | 트래픽 비용 절감 예상   |
| **S3**          | Lifecycle Policy 설계 (오래된 로그 아카이빙)                | 저장 비용 절감 예상     |

### 6.3 CI/CD 파이프라인 설계

> **참고**: 아래 내용은 CI/CD 자동화를 위한 설계이며, 실제 구현은 아직 진행되지 않았습니다.

**설계된 GitHub Actions 파이프라인 예시:**

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t consultation-booking-server .

      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_URI }}
          docker push ${{ secrets.ECR_URI }}/consultation-booking-server:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster consultation-booking-cluster --service consultation-booking-service --force-new-deployment
```

---

## 7. 설계 의사결정 요약

본 섹션에서는 주요 설계 의사결정과 그 근거를 요약합니다.

### 7.1 동시성 제어

**결정: Booked Count + 원자적 UPDATE**

**근거:**

- PostgreSQL의 원자적 UPDATE 활용으로 동시성 안전 보장
- COUNT(\*) 쿼리 불필요하여 성능 우수
- 구현 단순 (SELECT FOR UPDATE 락 로직 불필요)

**Trade-off:**

- `booked_count`는 파생 컬럼이므로 정합성 보장을 위해 CHECK 제약조건과 리콘실 배치 필요
- 하지만 운영상 관리 가능한 수준이며, 성능 이점이 더 큼

### 7.2 인증 방식

**결정: JWT (HTTP-only Cookie)**

**근거:**

- Stateless로 서버 확장 용이
- 성능 우수 (DB 조회 불필요)
- 마이크로서비스 친화적

**Trade-off:**

- 토큰 탈취 시 만료 시간까지 유효 (완화: 짧은 만료 시간)
- 하지만 HTTP-only Cookie 사용으로 XSS 공격 위험 감소

### 7.3 데이터베이스

**결정: PostgreSQL + Prisma ORM**

**근거:**

- PostgreSQL의 강력한 기능 (Partial Index, CHECK 제약조건 등)
- Prisma의 타입 안정성 및 개발 생산성
- Raw Query 지원으로 성능 최적화 가능

**Trade-off:**

- Prisma는 일부 고급 SQL 기능 지원이 제한적 (예: Partial Index는 마이그레이션 SQL로 직접 작성)
- 하지만 대부분의 요구사항을 충족하며, 타입 안정성 이점이 큼

### 7.4 배포 전략 설계

**설계 결정: AWS ECS Fargate + RDS (프로덕션 설계)**

> **참고**: 프로덕션 배포를 위한 설계이며, 실제 배포는 아직 진행되지 않았습니다.

**설계 근거:**

- 서버리스 컨테이너로 인프라 관리 부담 감소 예상
- 관리형 데이터베이스로 백업, 패치 자동화
- 확장성 및 안정성 우수

**Trade-off:**

- EKS(Kubernetes)에 비해 커스터마이징 제한
- 하지만 본 시스템 요구사항에는 ECS Fargate가 적합하며, 운영 부담 감소가 예상됨

---

## 결론

본 설계 문서에서는 상담예약 시스템의 전체 아키텍처, 동시성 제어, 데이터베이스 설계, 보안, 개발 환경 및 배포에 대해 상세히 설명했습니다. 각 설계 결정은 Trade-off를 고려하여 선택되었으며, 유지보수 가능하고 확장 가능한 구조를 목표로 했습니다.

주요 설계 원칙:

1. **명확한 계층 분리**: Controller-Service-Repository 패턴
2. **동시성 안전 보장**: 원자적 UPDATE를 통한 동시성 제어
3. **보안 우선**: JWT 인증, 입력값 검증, SQL Injection 방어
4. **확장 가능한 구조**: 모듈화, 의존성 주입, 테스트 용이성
5. **운영 효율성**: Docker 컨테이너화 (개발 환경 구현), AWS 관리형 서비스 활용 설계 (프로덕션)

향후 개선 사항:

- **캐싱 전략**: Redis를 활용한 세션 및 조회 결과 캐싱
- **이벤트 기반 아키텍처**: 예약 생성 시 이메일 발송 등을 이벤트로 처리
- **모니터링 강화**: APM 도구 도입 (예: DataDog, New Relic)
- **다중 지역 배포**: 재해 복구 및 지연 시간 개선

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-01-16
