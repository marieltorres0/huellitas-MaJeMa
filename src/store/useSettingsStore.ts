import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SPECIES_OPTIONS } from '../utils/speciesOptions'
import { DEFAULT_BREED_OPTIONS, type BreedOptionsMap } from '../utils/breedOptions'

type SettingsState = {
  isDarkMode: boolean
  profile: {
    nombre: string
    telefono: string
    direccion: string
  }
  speciesOptions: string[]
  breedOptions: BreedOptionsMap
  toggleDarkMode: () => void
  setProfile: (newProfile: {
    nombre: string
    telefono: string
    direccion: string
  }) => void
  setSpeciesOptions: (speciesOptions: string[]) => void
  setBreedOptions: (breedOptions: BreedOptionsMap) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      profile: {
        nombre: 'Huellitas MaJeMa',
        telefono: '(55) 1234 5678',
        direccion: 'Av. Amor y Cuidado 123, Col. Solidaridad, CDMX',
      },
      speciesOptions: [...DEFAULT_SPECIES_OPTIONS],
      breedOptions: { ...DEFAULT_BREED_OPTIONS },
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setProfile: (newProfile) => set({ profile: newProfile }),
      setSpeciesOptions: (speciesOptions) => set({ speciesOptions }),
      setBreedOptions: (breedOptions) => set({ breedOptions }),
    }),
    {
      name: 'settings-storage',
    },
  ),
)