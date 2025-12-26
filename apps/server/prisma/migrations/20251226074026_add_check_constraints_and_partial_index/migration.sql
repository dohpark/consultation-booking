-- 기존 데이터의 booked_count 초기화 (BOOKED 상태 예약만 카운트)
UPDATE "slots"
SET "booked_count" = (
  SELECT COUNT(*)
  FROM "reservations"
  WHERE "reservations"."slot_id" = "slots"."id"
    AND "reservations"."status" = 'BOOKED'
);

-- CHECK 제약조건 추가: booked_count 범위 검증 (필수)
ALTER TABLE "slots"
ADD CONSTRAINT "slots_booked_count_range"
CHECK ("booked_count" >= 0 AND "booked_count" <= "capacity");

-- CHECK 제약조건 추가: capacity 양수 검증 (권장)
ALTER TABLE "slots"
ADD CONSTRAINT "slots_capacity_positive"
CHECK ("capacity" > 0);

-- Partial Index 생성: reservations(slot_id, created_at) WHERE status='BOOKED'
-- ORDER BY created_at이 포함된 쿼리 최적화용
CREATE INDEX "reservations_booked_by_slot_created" 
ON "reservations"("slot_id", "created_at")
WHERE "status" = 'BOOKED';
