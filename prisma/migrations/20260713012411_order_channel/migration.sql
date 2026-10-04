-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerDocument" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "channel" TEXT NOT NULL DEFAULT 'SITE',
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "couponId" TEXT,
    "couponCode" TEXT,
    "paymentMethod" TEXT,
    "shipZipCode" TEXT,
    "shipStreet" TEXT,
    "shipNumber" TEXT,
    "shipComplement" TEXT,
    "shipDistrict" TEXT,
    "shipCity" TEXT,
    "shipState" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("couponCode", "couponId", "createdAt", "customerDocument", "customerEmail", "customerId", "customerName", "customerPhone", "discount", "id", "notes", "number", "paymentMethod", "shipCity", "shipComplement", "shipDistrict", "shipNumber", "shipState", "shipStreet", "shipZipCode", "shippingCost", "status", "subtotal", "total", "updatedAt", "userId") SELECT "couponCode", "couponId", "createdAt", "customerDocument", "customerEmail", "customerId", "customerName", "customerPhone", "discount", "id", "notes", "number", "paymentMethod", "shipCity", "shipComplement", "shipDistrict", "shipNumber", "shipState", "shipStreet", "shipZipCode", "shippingCost", "status", "subtotal", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
