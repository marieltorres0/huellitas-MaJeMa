import cors from 'cors'
import express from 'express'
import { prisma } from '../lib/prisma'

type PetPayload = {
  name: string
  breed: string
  age: string
  weight: string
  species: string
  medicalStatus: 'SANO' | 'EN_TRATAMIENTO' | 'NECESIDADES_ESPECIALES'
  medicalNotes: string
  adoptionStatus?: 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO'
  adopterName?: string | null
  adopterPhone?: string | null
  adopterAddress?: string | null
}

const app = express()
const port = Number(process.env.PORT ?? 3001)
const db = prisma as any

app.use(cors())
app.use(express.json())

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/pets', async (_req, res, next) => {
  try {
    const pets = await db.pet.findMany()
    res.json(pets)
  } catch (error) {
    next(error)
  }
})

app.get('/api/pets/:id', async (req, res, next) => {
  try {
    const pet = await db.pet.findUnique({ where: { id: req.params.id } })
    if (!pet) {
      res.status(404).json({ message: 'Pet not found' })
      return
    }

    res.json(pet)
  } catch (error) {
    next(error)
  }
})

app.post('/api/pets', async (req, res, next) => {
  try {
    const body = req.body as PetPayload

    const createdPet = await db.pet.create({
      data: {
        name: body.name,
        breed: body.breed,
        age: String(body.age),
        weight: String(body.weight),
        species: body.species,
        medicalStatus: body.medicalStatus,
        medicalNotes: body.medicalNotes ?? '',
        adoptionStatus: body.adoptionStatus ?? 'DISPONIBLE',
        adopterName: normalizeText(body.adopterName),
        adopterPhone: normalizeText(body.adopterPhone),
        adopterAddress: normalizeText(body.adopterAddress),
      },
    })

    res.status(201).json(createdPet)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/pets/:id', async (req, res, next) => {
  try {
    const existingPet = await db.pet.findUnique({ where: { id: req.params.id } })

    if (!existingPet) {
      res.status(404).json({ message: 'Pet not found' })
      return
    }

    const body = req.body as Partial<PetPayload>
    const nextStatus = body.adoptionStatus ?? existingPet.adoptionStatus
    const adopterName = normalizeText(body.adopterName) ?? existingPet.adopterName
    const adopterPhone = normalizeText(body.adopterPhone) ?? existingPet.adopterPhone
    const adopterAddress = normalizeText(body.adopterAddress) ?? existingPet.adopterAddress

    const shouldKeepAdopterData = nextStatus === 'EN_PROCESO' || nextStatus === 'ADOPTADO'

    const updatedPet = await db.pet.update({
      where: { id: req.params.id },
      data: {
        name: body.name ?? existingPet.name,
        breed: body.breed ?? existingPet.breed,
        age: body.age !== undefined ? String(body.age) : existingPet.age,
        weight: body.weight !== undefined ? String(body.weight) : existingPet.weight,
        species: body.species ?? existingPet.species,
        medicalStatus: body.medicalStatus ?? existingPet.medicalStatus,
        medicalNotes: body.medicalNotes ?? existingPet.medicalNotes,
        adoptionStatus: nextStatus,
        adopterName: shouldKeepAdopterData ? adopterName : null,
        adopterPhone: shouldKeepAdopterData ? adopterPhone : null,
        adopterAddress: shouldKeepAdopterData ? adopterAddress : null,
      },
    })

    res.json(updatedPet)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/pets/:id', async (req, res, next) => {
  try {
    await db.pet.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)

  if (error instanceof SyntaxError && 'status' in error && (error as { status?: number }).status === 400) {
    res.status(400).json({ message: 'El cuerpo de la petición no es JSON válido' })
    return
  }

  res.status(500).json({ message: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
