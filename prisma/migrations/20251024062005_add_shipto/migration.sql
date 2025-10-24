-- CreateTable
CREATE TABLE "ShipTo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skuId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShipTo_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ForecastEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forecastVersionId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "shipToId" TEXT,
    "orderMonth" DATETIME NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForecastEntry_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForecastEntry_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForecastEntry_shipToId_fkey" FOREIGN KEY ("shipToId") REFERENCES "ShipTo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ForecastEntry" ("createdAt", "forecastVersionId", "id", "orderMonth", "skuId", "updatedAt", "value") SELECT "createdAt", "forecastVersionId", "id", "orderMonth", "skuId", "updatedAt", "value" FROM "ForecastEntry";
DROP TABLE "ForecastEntry";
ALTER TABLE "new_ForecastEntry" RENAME TO "ForecastEntry";
CREATE INDEX "ForecastEntry_skuId_orderMonth_idx" ON "ForecastEntry"("skuId", "orderMonth");
CREATE INDEX "ForecastEntry_shipToId_idx" ON "ForecastEntry"("shipToId");
CREATE UNIQUE INDEX "ForecastEntry_forecastVersionId_skuId_shipToId_orderMonth_key" ON "ForecastEntry"("forecastVersionId", "skuId", "shipToId", "orderMonth");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ShipTo_code_idx" ON "ShipTo"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ShipTo_skuId_code_key" ON "ShipTo"("skuId", "code");
