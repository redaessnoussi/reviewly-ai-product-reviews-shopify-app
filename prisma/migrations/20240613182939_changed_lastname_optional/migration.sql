-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "rating" REAL NOT NULL,
    "sentiment" TEXT,
    "AiResponse" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Review" ("AiResponse", "approved", "comment", "createdAt", "firstName", "id", "imageUrl", "lastName", "productId", "rating", "sentiment", "videoUrl") SELECT "AiResponse", "approved", "comment", "createdAt", "firstName", "id", "imageUrl", "lastName", "productId", "rating", "sentiment", "videoUrl" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_key_check("Review");
PRAGMA foreign_keys=ON;
