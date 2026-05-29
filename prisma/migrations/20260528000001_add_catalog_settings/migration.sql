-- CreateTable
CREATE TABLE "CatalogSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "speciesOptions" JSONB NOT NULL,
    "breedOptions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogSettings_pkey" PRIMARY KEY ("id")
);