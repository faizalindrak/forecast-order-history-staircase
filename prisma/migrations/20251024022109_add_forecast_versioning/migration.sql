-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SKU" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ForecastVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ForecastEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forecastVersionId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "orderMonth" DATETIME NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForecastEntry_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForecastEntry_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SKU_partNumber_key" ON "SKU"("partNumber");

-- CreateIndex
CREATE INDEX "ForecastVersion_month_version_idx" ON "ForecastVersion"("month", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastVersion_month_version_key" ON "ForecastVersion"("month", "version");

-- CreateIndex
CREATE INDEX "ForecastEntry_skuId_orderMonth_idx" ON "ForecastEntry"("skuId", "orderMonth");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastEntry_forecastVersionId_skuId_orderMonth_key" ON "ForecastEntry"("forecastVersionId", "skuId", "orderMonth");
