-- CreateTable
CREATE TABLE `ProductViewHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `productId` INTEGER NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductViewHistory_userId_viewedAt_idx`(`userId`, `viewedAt`),
    INDEX `ProductViewHistory_productId_viewedAt_idx`(`productId`, `viewedAt`),
    INDEX `ProductViewHistory_userId_productId_viewedAt_idx`(`userId`, `productId`, `viewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductViewHistory` ADD CONSTRAINT `ProductViewHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductViewHistory` ADD CONSTRAINT `ProductViewHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
