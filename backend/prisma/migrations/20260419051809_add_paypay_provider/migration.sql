-- AlterTable
ALTER TABLE `paymentlog` MODIFY `provider` ENUM('TOSS', 'PAYPAY') NOT NULL DEFAULT 'TOSS';
