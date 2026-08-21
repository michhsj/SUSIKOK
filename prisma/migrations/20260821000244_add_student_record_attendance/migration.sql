-- CreateTable
CREATE TABLE "StudentRecordAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "includeAttendance" BOOLEAN NOT NULL DEFAULT false,
    "absence" INTEGER,
    "lateness" INTEGER,
    "earlyLeave" INTEGER,
    "outing" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRecordAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentRecordAttendance_userId_key" ON "StudentRecordAttendance"("userId");

-- CreateIndex
CREATE INDEX "StudentRecordAttendance_userId_idx" ON "StudentRecordAttendance"("userId");

-- AddForeignKey
ALTER TABLE "StudentRecordAttendance" ADD CONSTRAINT "StudentRecordAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
