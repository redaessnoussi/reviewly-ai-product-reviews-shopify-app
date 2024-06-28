-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "subscription" TEXT NOT NULL DEFAULT 'Free Plan',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSubscription" ("id", "shop", "subscription", "updatedAt") SELECT "id", "shop", "subscription", "updatedAt" FROM "ShopSubscription";
DROP TABLE "ShopSubscription";
ALTER TABLE "new_ShopSubscription" RENAME TO "ShopSubscription";
CREATE UNIQUE INDEX "ShopSubscription_shop_key" ON "ShopSubscription"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
