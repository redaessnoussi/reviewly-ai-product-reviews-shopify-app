-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "enableSentimentAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "enableAutomatedResponses" BOOLEAN NOT NULL DEFAULT false,
    "allowMedia" BOOLEAN NOT NULL DEFAULT true
);
