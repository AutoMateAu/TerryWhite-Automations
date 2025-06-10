/**
 * Formats a phone number to Australian format
 * Mobile: 04XX XXX XXX
 * Landline: (0X) XXXX XXXX
 */
export function formatAustralianPhoneNumber(value: string): string {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, "")

  // Handle empty input
  if (phoneNumber.length === 0) {
    return ""
  }

  // Mobile numbers (start with 04)
  if (phoneNumber.startsWith("04")) {
    if (phoneNumber.length <= 4) {
      return phoneNumber
    } else if (phoneNumber.length <= 7) {
      return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`
    } else if (phoneNumber.length <= 10) {
      return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 10)}`
    } else {
      // Limit to 10 digits for mobile
      return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 10)}`
    }
  }

  // Landline numbers (start with 0 but not 04)
  if (phoneNumber.startsWith("0") && !phoneNumber.startsWith("04")) {
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`
    } else if (phoneNumber.length <= 4) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    } else if (phoneNumber.length <= 8) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)} ${phoneNumber.slice(6)}`
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)} ${phoneNumber.slice(6, 10)}`
    } else {
      // Limit to 10 digits for landline
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)} ${phoneNumber.slice(6, 10)}`
    }
  }

  // For numbers that don't start with 0, assume they need a leading 0
  if (phoneNumber.length > 0 && !phoneNumber.startsWith("0")) {
    return formatAustralianPhoneNumber("0" + phoneNumber)
  }

  // Fallback for other cases
  return phoneNumber
}

/**
 * Validates if a phone number is a valid Australian format
 */
export function isValidAustralianPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "")

  // Mobile numbers: 10 digits starting with 04
  if (cleaned.startsWith("04") && cleaned.length === 10) {
    return true
  }

  // Landline numbers: 10 digits starting with 0 (but not 04)
  if (cleaned.startsWith("0") && !cleaned.startsWith("04") && cleaned.length === 10) {
    return true
  }

  return false
}

/**
 * Gets the maximum length for phone number input based on current value
 */
export function getPhoneNumberMaxLength(value: string): number {
  const cleaned = value.replace(/\D/g, "")

  // Mobile format: "04XX XXX XXX" = 12 characters
  if (cleaned.startsWith("04")) {
    return 12
  }

  // Landline format: "(0X) XXXX XXXX" = 14 characters
  if (cleaned.startsWith("0") && !cleaned.startsWith("04")) {
    return 14
  }

  // Default to mobile length
  return 12
}
