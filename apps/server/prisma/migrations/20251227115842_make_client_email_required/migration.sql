/*
  Warnings:

  - Made the column `client_email` on table `invite_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "invite_tokens" ALTER COLUMN "client_email" SET NOT NULL;
