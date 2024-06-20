-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "shop" TEXT NOT NULL,
    "enableSentimentAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "enableAutomatedResponses" BOOLEAN NOT NULL DEFAULT false,
    "allowMedia" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Settings" ("allowMedia", "enableAutomatedResponses", "enableSentimentAnalysis", "id", "shop") SELECT "allowMedia", "enableAutomatedResponses", "enableSentimentAnalysis", "id", "shop" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_id_key" ON "Settings"("id");
CREATE UNIQUE INDEX "Settings_shop_key" ON "Settings"("shop");
PRAGMA foreign_key_check("Settings");
PRAGMA foreign_keys=ON;
