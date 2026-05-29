import { type BreedOptionsMap } from '../utils/breedOptions'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const errorMessage = await response.text()
    throw new Error(errorMessage || 'Error al comunicar con la API de configuración')
  }

  return (await response.json()) as T
}

type CatalogSettingsResponse = {
  speciesOptions: string[]
  breedOptions: BreedOptionsMap
}

export function loadCatalogSettings() {
  return request<CatalogSettingsResponse>('/settings/catalogs')
}

export function saveCatalogSettings(payload: CatalogSettingsResponse) {
  return request<CatalogSettingsResponse>('/settings/catalogs', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}