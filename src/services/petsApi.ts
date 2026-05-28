import type { Pet } from '../store/petStore'

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
    throw new Error(errorMessage || 'Error al comunicar con la API de mascotas')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function listPets() {
  return request<Pet[]>('/pets')
}

export function createPet(pet: Omit<Pet, 'id'>) {
  return request<Pet>('/pets', {
    method: 'POST',
    body: JSON.stringify(pet),
  })
}

export function patchPet(id: string, pet: Partial<Pet>) {
  return request<Pet>(`/pets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(pet),
  })
}

export function removePet(id: string) {
  return request<void>(`/pets/${id}`, {
    method: 'DELETE',
  })
}
