-- DropForeignKey
ALTER TABLE "BookingExtra" DROP CONSTRAINT "BookingExtra_extraId_fkey";

-- AlterTable
ALTER TABLE "BookingExtra" ALTER COLUMN "extraId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BookingExtra" ADD CONSTRAINT "BookingExtra_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "Extra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
