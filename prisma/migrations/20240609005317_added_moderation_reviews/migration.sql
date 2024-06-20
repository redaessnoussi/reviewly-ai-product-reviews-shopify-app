-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "shop" TEXT NOT NULL,
    "enableSentimentAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "enableAutomatedResponses" BOOLEAN NOT NULL DEFAULT false,
    "allowMedia" BOOLEAN NOT NULL DEFAULT true,
    "reviewModeration" TEXT NOT NULL DEFAULT 'none'
);
INSERT INTO "new_Settings" ("allowMedia", "enableAutomatedResponses", "enableSentimentAnalysis", "id", "shop") SELECT "allowMedia", "enableAutomatedResponses", "enableSentimentAnalysis", "id", "shop" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_id_key" ON "Settings"("id");
CREATE UNIQUE INDEX "Settings_shop_key" ON "Settings"("shop");
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "sentiment" TEXT,
    "AiResponse" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Review" ("AiResponse", "comment", "createdAt", "firstName", "id", "imageUrl", "lastName", "productId", "rating", "sentiment", "videoUrl") SELECT "AiResponse", "comment", "createdAt", "firstName", "id", "imageUrl", "lastName", "productId", "rating", "sentiment", "videoUrl" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_key_check("Settings");
PRAGMA foreign_key_check("Review");
PRAGMA foreign_keys=ON;
