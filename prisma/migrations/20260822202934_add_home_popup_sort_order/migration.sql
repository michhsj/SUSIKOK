-- AlterTable
ALTER TABLE "HomePopup" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "HomePopup_sortOrder_idx" ON "HomePopup"("sortOrder");
