import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Species = 'Perro' | 'Gato' | 'Otro'
export type MedicalStatus = 'SANO' | 'EN_TRATAMIENTO' | 'NECESIDADES_ESPECIALES'
export type AdoptionStatus = 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO'

export interface Pet {
  id: string
  name: string
  breed: string
  age: string
  weight: string
  species: Species
  medicalStatus: MedicalStatus
  medicalNotes: string
  adoptionStatus: AdoptionStatus
  adopterName?: string
  adopterPhone?: string
  adopterAddress?: string
}

interface PetState {
  pets: Pet[]
  addPet: (pet: Omit<Pet, 'id'>) => void
  updatePet: (id: string, updatedData: Partial<Pet>) => void
  updateAdoptionStatus: (
    id: string,
    status: AdoptionStatus,
    adopterData?: Partial<Pick<Pet, 'adopterName' | 'adopterPhone' | 'adopterAddress'>>,
  ) => void
  deletePet: (id: string) => void
}

const initialPets: Pet[] = [
  {
    id: uuidv4(),
    name: 'Firulais',
    breed: 'Labrador',
    age: '3',
    weight: '20kg',
    species: 'Perro',
    medicalStatus: 'SANO',
    medicalNotes: 'Vacunado y desparasitado',
    adoptionStatus: 'DISPONIBLE',
  },
  {
    id: uuidv4(),
    name: 'Michi',
    breed: 'Siamés',
    age: '2',
    weight: '4kg',
    species: 'Gato',
    medicalStatus: 'EN_TRATAMIENTO',
    medicalNotes: 'Tratamiento por dermatitis en curso',
    adoptionStatus: 'EN_PROCESO',
  },
]

export const usePetStore = create<PetState>((set) => ({
  pets: initialPets,

  addPet: (pet) =>
    set((state) => ({
      pets: [
        ...state.pets,
        {
          ...pet,
          id: uuidv4(),
        },
      ],
    })),

  updatePet: (id, updatedData) =>
    set((state) => ({
      pets: state.pets.map((p) => (p.id === id ? { ...p, ...updatedData, id: p.id } : p)),
    })),

  updateAdoptionStatus: (id, status, adopterData) =>
    set((state) => ({
      pets: state.pets.map((p) => {
        if (p.id !== id) return p

        const updated: Pet = { ...p, adoptionStatus: status }

        if (status === 'ADOPTADO' && adopterData) {
          updated.adopterName = adopterData.adopterName ?? updated.adopterName
          updated.adopterPhone = adopterData.adopterPhone ?? updated.adopterPhone
          updated.adopterAddress = adopterData.adopterAddress ?? updated.adopterAddress
        } else if (status !== 'ADOPTADO') {
          // clear adopter info if not adopted
          delete updated.adopterName
          delete updated.adopterPhone
          delete updated.adopterAddress
        }

        return updated
      }),
    })),

  deletePet: (id) => set((state) => ({ pets: state.pets.filter((p) => p.id !== id) })),
}))
