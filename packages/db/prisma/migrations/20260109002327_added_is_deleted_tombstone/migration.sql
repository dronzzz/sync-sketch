-- DropIndex
DROP INDEX "Chat_roomId_idx";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Chat_roomId_isDeleted_idx" ON "Chat"("roomId", "isDeleted");
