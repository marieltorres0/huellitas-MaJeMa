export type BreedOptionsMap = Record<string, string[]>

export const DEFAULT_BREED_OPTIONS: BreedOptionsMap = {
  Perro: ['Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog', 'Poodle', 'Mestizo'],
  Gato: ['Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Esfinge', 'Mestizo'],
  Otro: ['Mestizo', 'Sin definir'],
}

export function getBreedOptionsForSpecies(species?: string, breedOptionsMap?: BreedOptionsMap) {
  const normalizedSpecies = species?.trim()
  if (!normalizedSpecies) return ['Mestizo']

  const optionsSource = breedOptionsMap ?? DEFAULT_BREED_OPTIONS
  return optionsSource[normalizedSpecies] ?? ['Mestizo', 'Sin definir']
}

export function mergeBreedOptions(options: string[], currentBreed?: string) {
  if (!currentBreed) return options

  const normalizedBreed = currentBreed.trim()
  if (!normalizedBreed) return options

  const exists = options.some((option) => option.toLowerCase() === normalizedBreed.toLowerCase())
  return exists ? options : [normalizedBreed, ...options]
}
