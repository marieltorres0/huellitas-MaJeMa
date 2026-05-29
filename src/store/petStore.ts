import { create } from 'zustand'
import { createPet, listPets, patchPet, removePet } from '../services/petsApi'

export type Species = string
export type MedicalStatus = 'SANO' | 'EN_TRATAMIENTO' | 'NECESIDADES_ESPECIALES'
export type AdoptionStatus = 'DISPONIBLE' | 'EN_PROCESO' | 'ADOPTADO'

export interface Pet {
  id: string
  name: string
  breed: string
  age: string
  birthDate?: string | null
  weight: string
  species: string
  medicalStatus: MedicalStatus
  medicalNotes: string
  adoptionStatus: AdoptionStatus
  adopterName?: string
  adopterPhone?: string
  adopterAddress?: string
}

interface PetState {
  pets: Pet[]
  isLoading: boolean
  error: string | null
  loadPets: () => Promise<void>
  addPet: (pet: Omit<Pet, 'id'>) => Promise<Pet>
  updatePet: (id: string, updatedData: Partial<Pet>) => Promise<Pet>
  updateAdoptionStatus: (
    id: string,
    status: AdoptionStatus,
    adopterData?: Partial<Pick<Pet, 'adopterName' | 'adopterPhone' | 'adopterAddress'>>,
  ) => Promise<Pet>
  deletePet: (id: string) => Promise<void>
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  isLoading: false,
  error: null,

  loadPets: async () => {
    set({ isLoading: true, error: null })

    try {
      const pets = await listPets()
      set({ pets, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar las mascotas',
        isLoading: false,
      })
      throw error
    }
  },

  addPet: async (pet) => {
    const createdPet = await createPet(pet)

    set((state) => ({
      pets: [...state.pets, createdPet],
    }))

    return createdPet
  },

  updatePet: async (id, updatedData) => {
    const updatedPet = await patchPet(id, updatedData)

    set((state) => ({
      pets: state.pets.map((pet) => (pet.id === id ? updatedPet : pet)),
    }))

    return updatedPet
  },

  updateAdoptionStatus: async (id, status, adopterData) => {
    const updatedPet = await patchPet(id, {
      adoptionStatus: status,
      ...(adopterData ?? {}),
    })

    set((state) => ({
      pets: state.pets.map((pet) => (pet.id === id ? updatedPet : pet)),
    }))

    return updatedPet
  },

  deletePet: async (id) => {
    await removePet(id)
    set((state) => ({ pets: state.pets.filter((pet) => pet.id !== id) }))
  },
}))
