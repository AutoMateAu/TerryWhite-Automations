"use server"

import type { CustomerAccount, PDFExportOptions } from "@/lib/types"
import type { PatientAccountData } from "@/lib/pdf-generator"

// Client-side function to generate PDF (this will be called from the client)
export async function generateAccountPDF(
  accounts: CustomerAccount[],
  options: PDFExportOptions,
  type: "single" | "multiple",
): Promise<void> {
  // This function will be implemented on the client side
  // since jsPDF needs to run in the browser
  throw new Error("This function should be called from the client side")
}

// Server-side function to prepare account data
export async function prepareAccountData(accountId: string): Promise<PatientAccountData | null> {
  try {
    // This would typically fetch from your database
    // For now, we'll return a structure that the client can use
    return null
  } catch (error) {
    console.error("Error preparing account data:", error)
    return null
  }
}

// Utility function to validate export options
export function validateExportOptions(options: PDFExportOptions): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if at least one content option is selected
  const contentOptions = [
    options.includeContactInfo,
    options.includePaymentHistory,
    options.includeCallHistory,
    options.includeOutstandingBalance,
    options.includeAccountSummary,
  ]

  if (!contentOptions.some((option) => option)) {
    errors.push("At least one content option must be selected")
  }

  // Validate date ranges
  if (options.paymentDateRange) {
    const startDate = new Date(options.paymentDateRange.startDate)
    const endDate = new Date(options.paymentDateRange.endDate)

    if (startDate > endDate) {
      errors.push("Payment history start date must be before end date")
    }
  }

  if (options.callDateRange) {
    const startDate = new Date(options.callDateRange.startDate)
    const endDate = new Date(options.callDateRange.endDate)

    if (startDate > endDate) {
      errors.push("Call history start date must be before end date")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
