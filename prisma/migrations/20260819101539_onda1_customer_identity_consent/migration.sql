-- AlterTable
ALTER TABLE "Order" ADD COLUMN "sessionId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CookieConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "necessary" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "consentVersion" TEXT NOT NULL DEFAULT 'v1',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CookieConsent" ("analytics", "createdAt", "id", "ip", "marketing", "necessary", "sessionId", "userAgent", "userId") SELECT "analytics", "createdAt", "id", "ip", "marketing", "necessary", "sessionId", "userAgent", "userId" FROM "CookieConsent";
DROP TABLE "CookieConsent";
ALTER TABLE "new_CookieConsent" RENAME TO "CookieConsent";
CREATE INDEX "CookieConsent_sessionId_idx" ON "CookieConsent"("sessionId");
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "documentNormalized" TEXT,
    "personType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "email" TEXT,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "instagramHandle" TEXT,
    "whatsapp" TEXT,
    "acquisitionChannel" TEXT,
    "firstUtmSource" TEXT,
    "firstUtmMedium" TEXT,
    "firstUtmCampaign" TEXT,
    "referrer" TEXT,
    "notes" TEXT,
    "totalSpent" DECIMAL NOT NULL DEFAULT 0,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "lastPurchaseAt" DATETIME,
    "mergedIntoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("createdAt", "deletedAt", "document", "email", "id", "lastPurchaseAt", "name", "notes", "personType", "phone", "totalSpent", "updatedAt", "userId") SELECT "createdAt", "deletedAt", "document", "email", "id", "lastPurchaseAt", "name", "notes", "personType", "phone", "totalSpent", "updatedAt", "userId" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");
CREATE INDEX "Customer_document_idx" ON "Customer"("document");
CREATE INDEX "Customer_email_idx" ON "Customer"("email");
CREATE INDEX "Customer_documentNormalized_idx" ON "Customer"("documentNormalized");
CREATE INDEX "Customer_phoneNormalized_idx" ON "Customer"("phoneNormalized");
CREATE INDEX "Customer_instagramHandle_idx" ON "Customer"("instagramHandle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
