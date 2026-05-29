export function formatBirthDateDigits(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function isValidBirthDateDisplay(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return false

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (day < 1 || month < 1 || year < 1) return false

  const iso = `${match[3]}-${match[2]}-${match[1]}`
  const date = new Date(`${iso}T00:00:00Z`)

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
}

export function birthDateDisplayToISO(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match || !isValidBirthDateDisplay(value)) return ''

  return `${match[3]}-${match[2]}-${match[1]}`
}

export function birthDateISOToDisplay(value?: string | null) {
  if (!value) return ''

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value

  return `${match[3]}/${match[2]}/${match[1]}`
}

export function birthDateDisplayToISOOrEmpty(value: string) {
  return value.trim() ? birthDateDisplayToISO(value) : ''
}