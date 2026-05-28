export const DEFAULT_BREED_OPTIONS: Record<string, string[]> = {
  Perro: ['Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog', 'Poodle', 'Mestizo'],
  Gato: ['Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Esfinge', 'Mestizo'],
  Otro: ['Mestizo', 'Sin definir'],
}

export function getBreedOptionsForSpecies(species?: string) {
  const normalizedSpecies = species?.trim()
  if (!normalizedSpecies) return ['Mestizo']

  return DEFAULT_BREED_OPTIONS[normalizedSpecies] ?? ['Mestizo', 'Sin definir']
}

export function mergeBreedOptions(options: string[], currentBreed?: string) {
  if (!currentBreed) return options

  const normalizedBreed = currentBreed.trim()
  if (!normalizedBreed) return options

  const exists = options.some((option) => option.toLowerCase() === normalizedBreed.toLowerCase())
  return exists ? options : [normalizedBreed, ...options]
}
