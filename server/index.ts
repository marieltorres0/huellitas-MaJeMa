import cors from 'cors'
import express from 'express'
import { prisma } from '../lib/prisma'
import { DEFAULT_BREED_OPTIONS } from '../src/utils/breedOptions'
import { DEFAULT_SPECIES_OPTIONS, normalizeSpeciesOption } from '../src/utils/speciesOptions'

type PetPayload = {
  name: string
  breed: string
  age: string
  birthDate?: string | null
  weight: string
  species: string
  medicalStatus: 'SANO' | 'EN_TRATAMIENTO' | 'NECESIDADES_ESPECIALES'
  medicalNotes: string
  adoptionStatus?: 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO'
  adopterName?: string | null
  adopterPhone?: string | null
  adopterAddress?: string | null
}

type CatalogSettingsPayload = {
  speciesOptions?: string[]
  breedOptions?: Record<string, string[]>
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

const normalizeBirthDate = (value: unknown) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const iso = `${match[1]}-${match[2]}-${match[3]}`
  const date = new Date(`${iso}T00:00:00Z`)

  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() + 1 !== Number(match[2]) ||
    date.getUTCDate() !== Number(match[3])
  ) {
    return null
  }

  return iso
}

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback

  const normalized = value
    .map((entry) => (typeof entry === 'string' ? normalizeSpeciesOption(entry) : ''))
    .filter((entry) => entry.length > 0)

  return normalized.length > 0 ? Array.from(new Set(normalized)) : fallback
}

const normalizeBreedMap = (value: unknown, speciesOptions: string[]) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_BREED_OPTIONS

  const input = value as Record<string, unknown>
  const output: Record<string, string[]> = {}

  for (const species of speciesOptions) {
    const breeds = Array.isArray(input[species]) ? input[species] : DEFAULT_BREED_OPTIONS[species] ?? ['Mestizo']
    const normalizedBreeds = breeds
      .map((entry) => (typeof entry === 'string' ? normalizeSpeciesOption(entry) : ''))
      .filter((entry) => entry.length > 0)

    output[species] = normalizedBreeds.length > 0 ? Array.from(new Set(normalizedBreeds)) : ['Mestizo']
  }

  return output
}

async function readCatalogSettings() {
  const existingSettings = await db.catalogSettings.findUnique({ where: { id: 1 } })

  if (existingSettings) {
    return existingSettings
  }

  return db.catalogSettings.create({
    data: {
      id: 1,
      speciesOptions: DEFAULT_SPECIES_OPTIONS as unknown as never,
      breedOptions: DEFAULT_BREED_OPTIONS as unknown as never,
    },
  })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/settings/catalogs', async (_req, res, next) => {
  try {
    const settings = await readCatalogSettings()
    res.json({
      speciesOptions: (settings.speciesOptions as string[]) ?? [...DEFAULT_SPECIES_OPTIONS],
      breedOptions: (settings.breedOptions as Record<string, string[]>) ?? DEFAULT_BREED_OPTIONS,
    })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/settings/catalogs', async (req, res, next) => {
  try {
    const body = req.body as CatalogSettingsPayload
    const speciesOptions = normalizeStringList(body.speciesOptions, [...DEFAULT_SPECIES_OPTIONS])
    const breedOptions = normalizeBreedMap(body.breedOptions, speciesOptions)

    const savedSettings = await db.catalogSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        speciesOptions: speciesOptions as unknown as never,
        breedOptions: breedOptions as unknown as never,
      },
      update: {
        speciesOptions: speciesOptions as unknown as never,
        breedOptions: breedOptions as unknown as never,
      },
    })

    res.json({
      speciesOptions: savedSettings.speciesOptions as string[],
      breedOptions: savedSettings.breedOptions as Record<string, string[]>,
    })
  } catch (error) {
    next(error)
  }
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
        birthDate: normalizeBirthDate(body.birthDate),
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
        birthDate: body.birthDate !== undefined ? normalizeBirthDate(body.birthDate) : existingPet.birthDate,
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
