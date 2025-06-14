/*
  Warnings:

  - You are about to drop the column `message` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shapeId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shapeId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('rect', 'ellipse', 'line', 'pencil', 'text');

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "message",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "shapeId" TEXT NOT NULL,
ADD COLUMN     "type" "ShapeType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_shapeId_key" ON "Chat"("shapeId");
