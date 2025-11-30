/*
  Warnings:

  - A unique constraint covering the columns `[roomId,shapeId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Chat_shapeId_key";

-- CreateIndex
CREATE INDEX "Chat_roomId_idx" ON "Chat"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_roomId_shapeId_key" ON "Chat"("roomId", "shapeId");
