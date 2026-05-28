import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  isDarkMode: boolean
  profile: {
    nombre: string
    telefono: string
    direccion: string
  }
  toggleDarkMode: () => void
  setProfile: (newProfile: {
    nombre: string
    telefono: string
    direccion: string
  }) => void
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
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setProfile: (newProfile) => set({ profile: newProfile }),
    }),
    {
      name: 'settings-storage',
    },
  ),
)