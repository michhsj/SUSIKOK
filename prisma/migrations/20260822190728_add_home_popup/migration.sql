-- CreateTable
CREATE TABLE "HomePopup" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'home',
    "title" TEXT NOT NULL DEFAULT '메인 팝업',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "width" INTEGER NOT NULL DEFAULT 420,
    "height" INTEGER NOT NULL DEFAULT 560,
    "positionX" INTEGER NOT NULL DEFAULT 24,
    "positionY" INTEGER NOT NULL DEFAULT 24,
    "todayHideEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePopup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePopup_key_key" ON "HomePopup"("key");

-- CreateIndex
CREATE INDEX "HomePopup_enabled_idx" ON "HomePopup"("enabled");

-- CreateIndex
CREATE INDEX "HomePopup_updatedAt_idx" ON "HomePopup"("updatedAt");
