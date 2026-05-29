import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SPECIES_OPTIONS } from '../utils/speciesOptions'
import { DEFAULT_BREED_OPTIONS, type BreedOptionsMap } from '../utils/breedOptions'
import { loadCatalogSettings, saveCatalogSettings } from '../services/settingsApi'

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
  loadCatalogs: () => Promise<void>
  saveCatalogs: (catalogs: { speciesOptions: string[]; breedOptions: BreedOptionsMap }) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
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
      loadCatalogs: async () => {
        const catalogs = await loadCatalogSettings()

        const currentState = get()
        const isStillDefaultCatalog =
          JSON.stringify(currentState.speciesOptions) === JSON.stringify(DEFAULT_SPECIES_OPTIONS) &&
          JSON.stringify(currentState.breedOptions) === JSON.stringify(DEFAULT_BREED_OPTIONS)

        if (isStillDefaultCatalog) {
          set({ speciesOptions: catalogs.speciesOptions, breedOptions: catalogs.breedOptions })
        }
      },
      saveCatalogs: async (catalogs) => {
        const savedCatalogs = await saveCatalogSettings(catalogs)
        set({ speciesOptions: savedCatalogs.speciesOptions, breedOptions: savedCatalogs.breedOptions })
      },
    }),
    {
      name: 'settings-storage',
      version: 2,
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        profile: state.profile,
      }),
      migrate: (persistedState) => {
        const storedState = persistedState as
          | Partial<Pick<SettingsState, 'isDarkMode' | 'profile' | 'speciesOptions' | 'breedOptions'>>
          | undefined

        return {
          isDarkMode: storedState?.isDarkMode ?? false,
          profile:
          storedState?.profile ??
          ({
            nombre: 'Huellitas MaJeMa',
            telefono: '(55) 1234 5678',
            direccion: 'Av. Amor y Cuidado 123, Col. Solidaridad, CDMX',
          } as SettingsState['profile']),
          speciesOptions: storedState?.speciesOptions ?? [...DEFAULT_SPECIES_OPTIONS],
          breedOptions: storedState?.breedOptions ?? { ...DEFAULT_BREED_OPTIONS },
        }
      },
    },
  ),
)