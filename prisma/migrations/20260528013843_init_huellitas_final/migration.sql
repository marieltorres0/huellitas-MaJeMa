/*
  Warnings:

  - You are about to drop the `Especie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mascota` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Species" AS ENUM ('Perro', 'Gato', 'Otro');

-- CreateEnum
CREATE TYPE "MedicalStatus" AS ENUM ('SANO', 'EN_TRATAMIENTO', 'NECESIDADES_ESPECIALES');

-- CreateEnum
CREATE TYPE "AdoptionStatus" AS ENUM ('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'normal');

-- DropForeignKey
ALTER TABLE "Mascota" DROP CONSTRAINT "Mascota_especieId_fkey";

-- DropTable
DROP TABLE "Especie";

-- DropTable
DROP TABLE "Mascota";

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "medicalStatus" "MedicalStatus" NOT NULL,
    "medicalNotes" TEXT NOT NULL,
    "adoptionStatus" "AdoptionStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "adopterName" TEXT,
    "adopterPhone" TEXT,
    "adopterAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelterProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShelterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
