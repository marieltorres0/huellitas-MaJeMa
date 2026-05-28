import 'dotenv/config'
import prisma from '../lib/prisma'

async function main() {
  const total = await prisma.pet.count()
  console.log(`Mascotas en la base de datos: ${total}`)
  if (total === 0) {
    console.log('No hay mascotas para eliminar.')
    return
  }

  const deleted = await prisma.pet.deleteMany({})
  console.log(`Eliminadas ${deleted.count} mascotas.`)
}

main()
  .catch((e) => {
    console.error('Error limpiando mascotas:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
