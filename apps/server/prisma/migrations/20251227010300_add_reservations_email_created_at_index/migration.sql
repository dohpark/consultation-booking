-- CreateIndex
CREATE INDEX "reservations_email_created_at_idx" ON "reservations"("email", "created_at" DESC);

