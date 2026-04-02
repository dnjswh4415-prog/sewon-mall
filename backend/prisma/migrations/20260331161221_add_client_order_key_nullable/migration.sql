/*
  Warnings:

  - The values [ORDER_DEDUCT] on the enum `StockHistory_changeType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[clientOrderKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentKey]` on the table `PaymentLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `clientOrderKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stockhistory` MODIFY `changeType` ENUM('ORDER_PAID', 'CANCEL_RESTORE', 'RETURN_RESTORE', 'REFUND_RESTORE', 'MANUAL_ADJUST') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_clientOrderKey_key` ON `Order`(`clientOrderKey`);

-- CreateIndex
CREATE UNIQUE INDEX `PaymentLog_paymentKey_key` ON `PaymentLog`(`paymentKey`);
