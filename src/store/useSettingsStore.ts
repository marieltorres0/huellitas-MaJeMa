import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SPECIES_OPTIONS } from '../utils/speciesOptions'

type SettingsState = {
  isDarkMode: boolean
  profile: {
    nombre: string
    telefono: string
    direccion: string
  }
  speciesOptions: string[]
  toggleDarkMode: () => void
  setProfile: (newProfile: {
    nombre: string
    telefono: string
    direccion: string
  }) => void
  setSpeciesOptions: (speciesOptions: string[]) => void
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
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setProfile: (newProfile) => set({ profile: newProfile }),
      setSpeciesOptions: (speciesOptions) => set({ speciesOptions }),
    }),
    {
      name: 'settings-storage',
    },
  ),
)