-- CreateIndex
CREATE INDEX `Address_userId_isDefault_idx` ON `Address`(`userId`, `isDefault`);

-- CreateIndex
CREATE INDEX `Category_parentId_idx` ON `Category`(`parentId`);

-- CreateIndex
CREATE INDEX `Category_name_idx` ON `Category`(`name`);

-- CreateIndex
CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`);

-- CreateIndex
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Order_userId_createdAt_idx` ON `Order`(`userId`, `createdAt`);

-- CreateIndex
CREATE INDEX `PaymentLog_orderId_createdAt_idx` ON `PaymentLog`(`orderId`, `createdAt`);

-- CreateIndex
CREATE INDEX `PaymentLog_status_createdAt_idx` ON `PaymentLog`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Product_createdAt_idx` ON `Product`(`createdAt`);

-- CreateIndex
CREATE INDEX `Product_categoryId_createdAt_idx` ON `Product`(`categoryId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Product_stock_idx` ON `Product`(`stock`);

-- CreateIndex
CREATE INDEX `Product_name_idx` ON `Product`(`name`);

-- CreateIndex
CREATE INDEX `ProductVariant_productId_isActive_idx` ON `ProductVariant`(`productId`, `isActive`);

-- CreateIndex
CREATE INDEX `ProductVariant_stock_idx` ON `ProductVariant`(`stock`);

-- RenameIndex
ALTER TABLE `order` RENAME INDEX `Order_addressId_fkey` TO `Order_addressId_idx`;

-- RenameIndex
ALTER TABLE `orderitem` RENAME INDEX `OrderItem_orderId_fkey` TO `OrderItem_orderId_idx`;

-- RenameIndex
ALTER TABLE `orderitem` RENAME INDEX `OrderItem_productId_fkey` TO `OrderItem_productId_idx`;

-- RenameIndex
ALTER TABLE `orderitem` RENAME INDEX `OrderItem_variantId_fkey` TO `OrderItem_variantId_idx`;
