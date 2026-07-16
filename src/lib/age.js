/**
 * Calculate age in whole years from a birthdate string (YYYY-MM-DD).
 * Returns null if the date is invalid.
 */
export function calculateAge(birthdateStr) {
  if (!birthdateStr) return null
  const birthdate = new Date(birthdateStr)
  if (Number.isNaN(birthdate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--
  }
  return age
}

export const MINIMUM_AGE = 18
