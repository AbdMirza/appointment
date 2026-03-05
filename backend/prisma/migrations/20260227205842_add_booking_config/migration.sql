-- CreateTable
CREATE TABLE "BookingConfig" (
    "id" TEXT NOT NULL,
    "slotInterval" INTEGER NOT NULL DEFAULT 15,
    "minBookingNotice" INTEGER NOT NULL DEFAULT 120,
    "maxBookingWindow" INTEGER NOT NULL DEFAULT 30,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "BookingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingConfig_businessId_key" ON "BookingConfig"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_businessId_dayOfWeek_key" ON "BusinessHours"("businessId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "BookingConfig" ADD CONSTRAINT "BookingConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
