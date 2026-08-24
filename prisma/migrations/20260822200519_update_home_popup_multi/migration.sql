/*
  Warnings:

  - You are about to drop the column `key` on the `HomePopup` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "HomePopup_key_key";

-- AlterTable
ALTER TABLE "HomePopup" DROP COLUMN "key";
