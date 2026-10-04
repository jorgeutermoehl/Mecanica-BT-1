-- AlterTable
ALTER TABLE "Order" ADD COLUMN "vehicleLabel" TEXT;

-- CreateTable
CREATE TABLE "VehicleMake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "makeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER,
    "engine" TEXT,
    "fuel" TEXT,
    "chassis" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerVehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "vehicleVersionId" TEXT NOT NULL,
    "year" INTEGER,
    "nickname" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerVehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerVehicle_vehicleVersionId_fkey" FOREIGN KEY ("vehicleVersionId") REFERENCES "VehicleVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "manufacturerId" TEXT,
    "description" TEXT,
    "technicalSpecs" TEXT,
    "fitment" TEXT,
    "fitmentType" TEXT NOT NULL DEFAULT 'SPECIFIC',
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
INSERT INTO "new_Product" ("brandId", "categoryId", "costPrice", "createdAt", "deletedAt", "description", "desiredMargin", "fitment", "heightCm", "id", "internalCode", "internalNotes", "lengthCm", "location", "manufacturerId", "minStock", "name", "originalCode", "promoPrice", "salePrice", "sku", "slug", "status", "stockQuantity", "technicalSpecs", "updatedAt", "warranty", "weightGrams", "widthCm") SELECT "brandId", "categoryId", "costPrice", "createdAt", "deletedAt", "description", "desiredMargin", "fitment", "heightCm", "id", "internalCode", "internalNotes", "lengthCm", "location", "manufacturerId", "minStock", "name", "originalCode", "promoPrice", "salePrice", "sku", "slug", "status", "stockQuantity", "technicalSpecs", "updatedAt", "warranty", "weightGrams", "widthCm" FROM "Product";
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
CREATE TABLE "new_ProductApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "vehicleVersionId" TEXT,
    "legacyText" TEXT,
    "vehicleBrand" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "yearStart" INTEGER,
    "yearEnd" INTEGER,
    "engine" TEXT,
    "notes" TEXT,
    CONSTRAINT "ProductApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductApplication_vehicleVersionId_fkey" FOREIGN KEY ("vehicleVersionId") REFERENCES "VehicleVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductApplication" ("engine", "id", "notes", "productId", "vehicleBrand", "vehicleModel", "yearEnd", "yearStart") SELECT "engine", "id", "notes", "productId", "vehicleBrand", "vehicleModel", "yearEnd", "yearStart" FROM "ProductApplication";
DROP TABLE "ProductApplication";
ALTER TABLE "new_ProductApplication" RENAME TO "ProductApplication";
CREATE INDEX "ProductApplication_productId_idx" ON "ProductApplication"("productId");
CREATE INDEX "ProductApplication_vehicleBrand_vehicleModel_idx" ON "ProductApplication"("vehicleBrand", "vehicleModel");
CREATE INDEX "ProductApplication_vehicleVersionId_idx" ON "ProductApplication"("vehicleVersionId");
CREATE INDEX "ProductApplication_vehicleVersionId_productId_idx" ON "ProductApplication"("vehicleVersionId", "productId");
CREATE UNIQUE INDEX "ProductApplication_productId_vehicleVersionId_key" ON "ProductApplication"("productId", "vehicleVersionId");
CREATE TABLE "new_Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "personType" TEXT NOT NULL DEFAULT 'COMPANY',
    "email" TEXT,
    "phone" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "paymentTerms" TEXT,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Supplier" ("city", "complement", "createdAt", "deletedAt", "district", "document", "email", "id", "legalName", "notes", "number", "paymentTerms", "personType", "phone", "state", "street", "tradeName", "updatedAt", "zipCode") SELECT "city", "complement", "createdAt", "deletedAt", "district", "document", "email", "id", "legalName", "notes", "number", "paymentTerms", "personType", "phone", "state", "street", "tradeName", "updatedAt", "zipCode" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE INDEX "Supplier_document_idx" ON "Supplier"("document");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "VehicleMake"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_slug_key" ON "VehicleModel"("makeId", "slug");

-- CreateIndex
CREATE INDEX "VehicleVersion_modelId_yearStart_yearEnd_idx" ON "VehicleVersion"("modelId", "yearStart", "yearEnd");

-- CreateIndex
CREATE INDEX "CustomerVehicle_customerId_idx" ON "CustomerVehicle"("customerId");
