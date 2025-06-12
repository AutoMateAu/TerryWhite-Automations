"use client"

import type { CustomerAccount, PDFExportOptions, BulkReportOptions } from "@/lib/types"
import { PDFGenerator, type PatientAccountData } from "@/lib/pdf-generator"
import { BulkPDFGenerator } from "@/lib/bulk-pdf-generator"
import { getPaymentHistory, getCallHistory } from "@/services/accounting-service"

/**
 * Generates a PDF report for customer accounts and returns it as a Blob.
 * This function is designed to be called from the client side.
 * @param accounts The customer accounts to include in the PDF.
 * @param options PDF export options.
 * @param type The type of export ("single" or "multiple").
 * @param bulkOptions Optional bulk report options.
 * @returns A Promise that resolves to a Blob containing the generated PDF.
 */
export async function generateAccountPDF(
  accounts: CustomerAccount[],
  options: PDFExportOptions,
  type: "single" | "multiple",
  bulkOptions?: any,
): Promise<Blob> {
  try {
    const accountsData: PatientAccountData[] = []

    for (const account of accounts) {
      let paymentHistory = []
      let callHistory = []

      try {
        paymentHistory = await getPaymentHistory(account.id)
      } catch (error) {
        console.warn("Error fetching payment history:", error)
        paymentHistory = []
      }

      try {
        callHistory = await getCallHistory(account.id)
      } catch (error) {
        console.warn("Error fetching call history:", error)
        callHistory = []
      }

      const totalPayments = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
      const lastCallDate = callHistory.length > 0 ? callHistory[0].callDate : undefined
      const accountAge = Math.floor(
        (new Date().getTime() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      )

      accountsData.push({
        account,
        paymentHistory,
        callHistory,
        totalPayments,
        lastCallDate,
        accountAge,
      })
    }

    let pdfBlob: Blob

    if (bulkOptions) {
      const bulkGenerator = new BulkPDFGenerator()
      bulkGenerator.generateBulkReport(accountsData, options, bulkOptions, "all")
      pdfBlob = bulkGenerator.output("blob")
    } else {
      const pdfGenerator = new PDFGenerator()

      if (type === "single" && accountsData.length === 1) {
        pdfGenerator.generateSingleAccountPDF(accountsData[0], options)
      } else {
        pdfGenerator.generateMultipleAccountsPDF(accountsData, options)
      }
      pdfBlob = pdfGenerator.output("blob")
    }

    return pdfBlob
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF. Please try again.")
  }
}

// New function for bulk reports (overdue, all, current) - this will also return a Blob
export async function generateBulkAccountsPDF(
  accounts: CustomerAccount[],
  options: PDFExportOptions,
  reportType: "overdue" | "all" | "current",
  bulkOptions: BulkReportOptions,
): Promise<Blob> {
  try {
    const accountsData: PatientAccountData[] = []
    const batchSize = 20

    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize)

      for (const account of batch) {
        let paymentHistory = []
        let callHistory = []

        try {
          paymentHistory = await getPaymentHistory(account.id)
        } catch (error) {
          console.warn("Error fetching payment history:", error)
          paymentHistory = []
        }

        try {
          callHistory = await getCallHistory(account.id)
        } catch (error) {
          console.warn("Error fetching call history:", error)
          callHistory = []
        }

        let filteredPayments = paymentHistory
        let filteredCalls = callHistory

        if (options.paymentDateRange) {
          const startDate = new Date(options.paymentDateRange.startDate)
          const endDate = new Date(options.paymentDateRange.endDate)
          filteredPayments = paymentHistory.filter((payment) => {
            const paymentDate = new Date(payment.paymentDate)
            return paymentDate >= startDate && paymentDate <= endDate
          })
        }

        if (options.callDateRange) {
          const startDate = new Date(options.callDateRange.startDate)
          const endDate = new Date(options.callDateRange.endDate)
          filteredCalls = callHistory.filter((call) => {
            const callDate = new Date(call.callDate)
            return callDate >= startDate && callDate <= endDate
          })
        }

        const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
        const lastCallDate = filteredCalls.length > 0 ? filteredCalls[0].callDate : undefined
        const accountAge = Math.floor(
          (new Date().getTime() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        )

        accountsData.push({
          account,
          paymentHistory: filteredPayments,
          callHistory: filteredCalls,
          totalPayments,
          lastCallDate,
          accountAge,
        })
      }

      if (i + batchSize < accounts.length) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    const bulkGenerator = new BulkPDFGenerator()
    bulkGenerator.generateBulkReport(accountsData, options, bulkOptions, reportType)

    return bulkGenerator.output("blob")
  } catch (error) {
    console.error("Error generating bulk PDF:", error)
    throw new Error("Failed to generate bulk PDF report. Please try again.")
  }
}

// Utility function to estimate processing time
export function estimateProcessingTime(accountCount: number, options: PDFExportOptions): number {
  const baseTime = 2000 // 2 seconds base
  const timePerAccount = 500 // 0.5 seconds per account
  const historyMultiplier = (options.includePaymentHistory ? 1.3 : 1) * (options.includeCallHistory ? 1.2 : 1)

  return Math.round(baseTime + accountCount * timePerAccount * historyMultiplier)
}

// Function to check if browser supports PDF generation
export function checkPDFSupport(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof Blob !== "undefined" &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function"
    )
  } catch {
    return false
  }
}
