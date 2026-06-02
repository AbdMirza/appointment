-- AlterTable
ALTER TABLE "BookingConfig" ALTER COLUMN "lateCancelPolicy" SET DEFAULT 'ALLOW_LATE_MARK';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundAmount" DECIMAL(10,2);
