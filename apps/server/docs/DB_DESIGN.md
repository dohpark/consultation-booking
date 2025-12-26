# 데이터베이스 설계 문서

## 개요

상담예약 시스템의 데이터베이스 설계 및 제약조건, 인덱스 설계에 대한 문서입니다.

---

## 1. 중복 예약 방지

### 설계

- **제약조건**: `UNIQUE(slot_id, email)`
- **위치**: `reservations` 테이블
- **목적**: 같은 슬롯에 같은 이메일로 중복 예약 방지

### 구현

```prisma
@@unique([slotId, email], name: "uniq_reservation_slot_email")
```

### 동작 방식

- 데이터베이스 레벨에서 강제하는 제약조건
- 동일한 `(slot_id, email)` 조합으로 예약 시도 시 DB 에러 발생
- 애플리케이션 레벨에서 Prisma 에러 코드 `P2002`로 감지
- Email 정규화: `toLowerCase().trim()` 적용

---

## 2. 슬롯 정원(Capacity) 제한 및 동시성 처리

### 요구사항

- 각 슬롯은 최대 3명까지만 예약 가능
- 동시성 문제 해결 필요 (여러 사용자가 동시에 예약 시도)

### 선택한 방식: Booked Count + 조건부 증가 ⭐

**핵심 설계:**

- `slots.capacity` 필드로 최대 인원 수 저장 (기본값 3)
- `slots.booked_count` 필드로 현재 예약 수 저장 (기본값 0)
- 예약 생성 시 원자적 UPDATE로 좌석 확보:
  ```sql
  UPDATE slots
  SET booked_count = booked_count + 1
  WHERE id = ? AND booked_count < capacity
  RETURNING id
  ```

**선택 이유:**

1. **원자적 처리**: UPDATE 한 줄이 원자적으로 처리되어 동시성 안전 보장
2. **성능**: COUNT(\*) 쿼리 불필요 → 부하 감소
3. **구현 단순**: 복잡한 트랜잭션 락 로직 불필요
4. **PostgreSQL 최적화**: 원자적 UPDATE 활용

**핵심 원칙:**

- 예약 생성: **트랜잭션으로 좌석 확보 UPDATE + reservation INSERT** (같은 트랜잭션)
  - **UPDATE 결과 0 rows 처리 (필수)**: slot 재조회하여 구분
    - slot 없음 → 404 (NotFoundException)
    - slot 있으나 가득 참 → 400 (BadRequestException)
  - UNIQUE 충돌 시 트랜잭션 전체 롤백으로 `booked_count` 자동 복구
  - 중복 예약은 DB 유니크로 막고(P2002), 트랜잭션 롤백에 맡김
- 상태 전이: `WHERE status='BOOKED'` 조건으로 멱등하게 처리 후 `booked_count - 1`
  - 성공 시에만 `booked_count - 1` (0 rows면 아무것도 하지 않음)
- **트리거는 사용하지 않음** (좌석 확보 UPDATE 방식과 충돌)

**상태 전이 규칙:**

- `booked_count`는 **"현재 자리 점유 상태(BOOKED)"만** 포함
- BOOKED에서 벗어나는 모든 상태 전이(CANCELLED, COMPLETED, NO_SHOW 등)는 `booked_count - 1` 대상
- 모든 상태 전이는 `WHERE status = 'BOOKED'` 조건으로 멱등하게 처리

---

## 3. 트레이드오프 요약

| 항목              | Booked Count + 조건부 증가   | 트랜잭션 + Count Lock  | Seat Number                  |
| ----------------- | ---------------------------- | ---------------------- | ---------------------------- |
| **스키마 복잡도** | 중간 (booked_count 추가)     | 낮음 ✅                | 높음 ❌                      |
| **구현 복잡도**   | 낮음 ✅                      | 높음 (FOR UPDATE 필요) | 낮음 ✅                      |
| **동시성 처리**   | 원자적 UPDATE로 자동 처리 ✅ | 트랜잭션 + 락 필요     | DB 제약조건으로 자동 처리 ✅ |
| **성능**          | COUNT(\*) 불필요 ✅          | COUNT(\*) 오버헤드     | 제약조건 체크 오버헤드       |
| **Prisma 호환성** | Raw Query 필요 (간단)        | Raw Query 필요 (복잡)  | Prisma 직접 지원 ✅          |
| **유연성**        | 높음 (슬롯별 capacity) ✅    | 높음 ✅                | 낮음                         |
| **락 경합**       | 낮음 (UPDATE row-lock) ✅    | 높음                   | 없음 ✅                      |

**최종 결정 근거:**

1. PostgreSQL 최적화: 원자적 UPDATE 활용
2. 성능: COUNT(\*) 쿼리 불필요
3. 구현 단순성: 복잡한 트랜잭션 락 로직 불필요
4. 확장성: 슬롯별 capacity 변경 용이
5. 정합성 보장: CHECK 제약조건 + 배치 리콘실로 안전장치 강화

---

## 4. 인덱스 전략

### 설계된 인덱스

#### 4.1. `slots(counselor_id, start_at)`

- **목적**: 상담사별 날짜별 슬롯 조회 최적화
- **효과**: 상담사 대시보드에서 캘린더 조회 성능 향상

#### 4.2. `reservations(slot_id, status)` 또는 Partial Index

- **기본 적용**: Partial Index (PostgreSQL 전용) ⭐
  - `ORDER BY created_at`이 포함된 쿼리가 있으면:
    ```sql
    CREATE INDEX reservations_booked_by_slot_created
    ON reservations(slot_id, created_at)
    WHERE status = 'BOOKED';
    ```
  - 정렬이 없으면:
    ```sql
    CREATE INDEX reservations_booked_by_slot
    ON reservations(slot_id)
    WHERE status = 'BOOKED';
    ```
- **대안**: DB가 PostgreSQL이 아닐 경우 복합 인덱스로 대체

#### 4.3. `consultation_notes(slot_id)`

- **목적**: 슬롯별 상담 기록 조회 최적화

#### 4.4. `invite_tokens(expires_at)`, `reservation_tokens(expires_at)`

- **목적**: 만료된 토큰 정리 쿼리 최적화

### UNIQUE 제약조건으로 자동 생성되는 인덱스

- `counselors(email)`, `counselors(google_sub)`
- `invite_tokens(token)`, `reservation_tokens(token)`
- `reservations(slot_id, email)`: 중복 예약 방지

---

## 5. 제약조건

### CHECK 제약조건

1. **`slots.booked_count` 범위 검증 (필수)**:

   ```sql
   CHECK (booked_count >= 0 AND booked_count <= capacity)
   ```

2. **`slots.capacity` 양수 검증 (권장)**:
   ```sql
   CHECK (capacity > 0)
   ```

### UNIQUE 제약조건

- `counselors(email)`, `counselors(google_sub)`
- `reservations(slot_id, email)`: 중복 예약 방지
- `invite_tokens(token)`, `reservation_tokens(token)`
- `reservation_tokens(reservation_id)`, `consultation_notes(reservation_id)`

### Foreign Key 제약조건

- 모든 FK는 `onDelete: Cascade` 설정

---

## 6. 정합성 보강

`booked_count`는 파생 컬럼이므로 애플리케이션 실수나 예외 상황에서 정합성이 깨질 수 있습니다.

### 방법 1: CHECK 제약조건 (필수)

```sql
CHECK (booked_count >= 0 AND booked_count <= capacity)
```

- `booked_count`가 음수나 `capacity` 초과 시 즉시 에러 발생
- 정합성 깨짐을 빠르게 감지

**운영 규칙 (capacity 변경 시):**

- **capacity 감소**: `booked_count` 이상으로만 가능
  - 어드민 API에서 `newCapacity < bookedCount`이면 무조건 400 에러로 선제 검증 필수
- **capacity 증가**: 제약 없음

### 방법 2: 주기적 리콘실 배치 (운영 필수)

하루 1회 또는 주기적으로 실행하여 정합성을 복구:

```sql
-- 전체 갱신
UPDATE slots
SET booked_count = (
  SELECT COUNT(*)
  FROM reservations
  WHERE reservations.slot_id = slots.id
    AND reservations.status = 'BOOKED'
);

-- 또는 최근 변경된 슬롯만 (운영 규모가 커질 경우)
UPDATE slots
SET booked_count = (...)
WHERE updated_at >= NOW() - INTERVAL '1 day';
```

**필수**: CHECK 제약조건 + 배치 리콘실을 함께 사용해야 정합성 안전장치가 강화됩니다.

---

## 7. 스키마 변경 사항

### 필수 변경

- `slots.booked_count` 필드 추가 (기본값 0)
- CHECK 제약조건 2개 추가
- 마이그레이션 시 기존 데이터의 `booked_count` 초기화:
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

## 8. 운영 규칙

1. 예약 생성/취소/상태 변경은 **반드시 지정된 로직(트랜잭션)으로만 수행**
2. 관리자 수동 수정이나 스크립트로 `reservations`를 직접 조작 시 정합성 깨질 수 있음 → 리콘실 필요
3. **트리거는 사용하지 않음** (좌석 확보 UPDATE 방식과 충돌)
4. 어드민 API에서 capacity 감소 시 선제 검증(400) 필수
5. 리콘실 배치 작업 로그를 남겨 불일치 슬롯 수를 추적

---

## 9. 구현 필수 체크리스트

다음 항목은 반드시 지켜야 합니다:

### 예약 생성

- ✅ **무조건 트랜잭션**: (좌석 확보 UPDATE) + (reservation INSERT)를 같은 트랜잭션으로
- ✅ **UPDATE 0 rows 처리**: slot 재조회하여 구분
  - slot 없음 → 404
  - slot 있으나 가득 참 → 400
- ✅ **중복 예약**: DB 유니크로 막고(P2002), 트랜잭션 롤백에 맡김

### 상태 전이

- ✅ `WHERE status='BOOKED'`로 멱등하게 처리
- ✅ 성공 시에만 `booked_count - 1` (0 rows면 아무것도 하지 않음)

### 제약조건

- ✅ CHECK 2개 필수:
  - `booked_count >= 0 AND booked_count <= capacity`
  - `capacity > 0`

### 정합성 보강

- ✅ 리콘실 배치 + 로그(불일치 개수) 기록

### 금지 사항

- ✅ 트리거 금지
