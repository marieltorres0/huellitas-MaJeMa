export const DEFAULT_SPECIES_OPTIONS = ['Perro', 'Gato', 'Otro'] as const

export function normalizeSpeciesOption(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ')

  if (!trimmed) return ''

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function mergeSpeciesOptions(options: string[], currentSpecies?: string) {
  if (!currentSpecies) return options

  const normalizedCurrent = currentSpecies.trim()
  if (!normalizedCurrent) return options

  const exists = options.some((option) => option.toLowerCase() === normalizedCurrent.toLowerCase())
  return exists ? options : [...options, normalizedCurrent]
}