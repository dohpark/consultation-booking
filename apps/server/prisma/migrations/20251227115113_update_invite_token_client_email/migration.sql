-- AlterTable
ALTER TABLE "invite_tokens" ADD COLUMN     "client_email" TEXT;

-- CreateIndex
CREATE INDEX "invite_tokens_client_email_idx" ON "invite_tokens"("client_email");
