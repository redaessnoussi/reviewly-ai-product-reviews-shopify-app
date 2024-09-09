/*
  Warnings:

  - A unique constraint covering the columns `[shopId]` on the table `ShopSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopSubscription_shopId_key" ON "ShopSubscription"("shopId");
