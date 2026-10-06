-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceOnRequest" BOOLEAN NOT NULL DEFAULT false;

