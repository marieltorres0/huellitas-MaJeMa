// prisma/seed.ts
import { initialPetsSeed } from "./data/mascotas";
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["query"] });

async function main() {
  console.info("Sembrando la base de datos real de Huellitas MaJeMa...");
  try {
    // 1. Limpiar datos existentes para evitar duplicados
    await prisma.pet.deleteMany({});
    await prisma.shelterProfile.deleteMany({});

    // 2. Insertar las mascotas en la tabla Pet
    const petsResult = await prisma.pet.createMany({
      data: initialPetsSeed,
      skipDuplicates: true,
    });
    console.info(`🐾 Mascotas insertadas con éxito: ${petsResult.count}`);

    // 3. Insertar la configuración inicial del refugio
    await prisma.shelterProfile.create({
      data: {
        id: 1,
        nombre: 'Huellitas MaJeMa',
        telefono: '(55) 1234 5678',
        direccion: 'Av. Amor y Cuidado 123, Col. Solidaridad, CDMX',
      }
    });
    console.info("⚙️ Configuración inicial del refugio insertada.");

  } catch (error) {
    console.error("❌ El Seed falló:", error);
    throw error;
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });