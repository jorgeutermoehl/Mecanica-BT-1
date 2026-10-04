-- Remove o catálogo de veículos (fitment normalizado, garagem do cliente, Meu Carro).
-- A loja passa a ser focada em peças de tuning; a aplicação fica em Product.fitment (texto livre).

-- DropIndex
DROP INDEX "CustomerVehicle_customerId_idx";

-- DropIndex
DROP INDEX "ProductApplication_productId_vehicleVersionId_key";

-- DropIndex
DROP INDEX "ProductApplication_vehicleVersionId_productId_idx";

-- DropIndex
DROP INDEX "ProductApplication_vehicleVersionId_idx";

-- DropIndex
DROP INDEX "ProductApplication_vehicleBrand_vehicleModel_idx";

-- DropIndex
DROP INDEX "ProductApplication_productId_idx";

-- DropIndex
DROP INDEX "VehicleMake_slug_key";

-- DropIndex
DROP INDEX "VehicleModel_makeId_slug_key";

-- DropIndex
DROP INDEX "VehicleVersion_modelId_yearStart_yearEnd_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CustomerVehicle";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductApplication";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VehicleMake";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VehicleModel";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VehicleVersion";
PRAGMA foreign_keys=on;

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
    "sessionId" TEXT,
    "externalReference" TEXT,
    "paymentProvider" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("channel", "couponCode", "couponId", "createdAt", "customerDocument", "customerEmail", "customerId", "customerName", "customerPhone", "discount", "externalReference", "id", "notes", "number", "paidAt", "paymentMethod", "paymentProvider", "sessionId", "shipCity", "shipComplement", "shipDistrict", "shipNumber", "shipState", "shipStreet", "shipZipCode", "shippingCost", "status", "subtotal", "total", "updatedAt", "userId") SELECT "channel", "couponCode", "couponId", "createdAt", "customerDocument", "customerEmail", "customerId", "customerName", "customerPhone", "discount", "externalReference", "id", "notes", "number", "paidAt", "paymentMethod", "paymentProvider", "sessionId", "shipCity", "shipComplement", "shipDistrict", "shipNumber", "shipState", "shipStreet", "shipZipCode", "shippingCost", "status", "subtotal", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE UNIQUE INDEX "Order_externalReference_key" ON "Order"("externalReference");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "internalCode" TEXT,
    "originalCode" TEXT,
    "gtin" TEXT,
    "oemCodes" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'NEW',
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "manufacturerId" TEXT,
    "description" TEXT,
    "technicalSpecs" TEXT,
    "fitment" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "searchKeywords" TEXT,
    "costPrice" DECIMAL NOT NULL DEFAULT 0,
    "salePrice" DECIMAL NOT NULL DEFAULT 0,
    "promoPrice" DECIMAL,
    "desiredMargin" DECIMAL,
    "minMarginPercent" DECIMAL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "targetCoverageDays" INTEGER NOT NULL DEFAULT 30,
    "leadTimeDaysOverride" INTEGER,
    "supplierId" TEXT,
    "location" TEXT,
    "weightGrams" INTEGER,
    "widthCm" DECIMAL,
    "heightCm" DECIMAL,
    "lengthCm" DECIMAL,
    "warranty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brandId", "categoryId", "condition", "costPrice", "createdAt", "deletedAt", "description", "desiredMargin", "fitment", "gtin", "heightCm", "id", "internalCode", "internalNotes", "leadTimeDaysOverride", "lengthCm", "location", "manufacturerId", "metaDescription", "metaTitle", "minMarginPercent", "minStock", "name", "oemCodes", "originalCode", "promoPrice", "safetyStock", "salePrice", "searchKeywords", "sku", "slug", "status", "stockQuantity", "supplierId", "targetCoverageDays", "technicalSpecs", "updatedAt", "warranty", "weightGrams", "widthCm") SELECT "brandId", "categoryId", "condition", "costPrice", "createdAt", "deletedAt", "description", "desiredMargin", "fitment", "gtin", "heightCm", "id", "internalCode", "internalNotes", "leadTimeDaysOverride", "lengthCm", "location", "manufacturerId", "metaDescription", "metaTitle", "minMarginPercent", "minStock", "name", "oemCodes", "originalCode", "promoPrice", "safetyStock", "salePrice", "searchKeywords", "sku", "slug", "status", "stockQuantity", "supplierId", "targetCoverageDays", "technicalSpecs", "updatedAt", "warranty", "weightGrams", "widthCm" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");
CREATE INDEX "Product_originalCode_idx" ON "Product"("originalCode");
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

