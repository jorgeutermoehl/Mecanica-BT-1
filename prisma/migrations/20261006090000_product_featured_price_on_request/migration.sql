-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
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

