"use client"

import type { CustomerAccount, PDFExportOptions, BulkReportOptions } from "@/lib/types"
import { PDFGenerator, generatePDFFilename, type PatientAccountData } from "@/lib/pdf-generator"
import { BulkPDFGenerator, generateBulkPDFFilename } from "@/lib/bulk-pdf-generator"
import { getPaymentHistory, getCallHistory } from "@/services/accounting-service"

export async function generateAccountPDF(
  accounts: CustomerAccount[],
  options: PDFExportOptions,
  type: "single" | "multiple",
  bulkOptions?: any,
): Promise<void> {
  try {
    // Prepare account data
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

    // Generate PDF
    if (bulkOptions) {
      // Use bulk generator for "all" mode
      const bulkGenerator = new BulkPDFGenerator()
      bulkGenerator.generateBulkReport(accountsData, options, bulkOptions, "all")
      const filename = generateBulkPDFFilename("all", accountsData.length)
      bulkGenerator.save(filename)
    } else {
      // Use regular generator for single/multiple
      const pdfGenerator = new PDFGenerator()

      if (type === "single" && accountsData.length === 1) {
        pdfGenerator.generateSingleAccountPDF(accountsData[0], options)
        const filename = generatePDFFilename("single", accountsData[0].account.patientName)
        pdfGenerator.save(filename)
      } else {
        pdfGenerator.generateMultipleAccountsPDF(accountsData, options)
        const filename = generatePDFFilename("multiple", undefined, `${accountsData.length}-accounts`)
        pdfGenerator.save(filename)
      }
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF. Please try again.")
  }
}

// New function for bulk reports (overdue, all, current)
export async function generateBulkAccountsPDF(
  accounts: CustomerAccount[],
  options: PDFExportOptions,
  reportType: "overdue" | "all" | "current",
  bulkOptions: BulkReportOptions,
): Promise<void> {
  try {
    // Prepare account data with progress tracking for large datasets
    const accountsData: PatientAccountData[] = []
    const batchSize = 20 // Process in batches to avoid blocking UI

    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize)

      // Process batch
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

        // Apply date filters if specified
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

      // Allow UI to update between batches
      if (i + batchSize < accounts.length) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    // Generate PDF using bulk generator
    const bulkGenerator = new BulkPDFGenerator()
    bulkGenerator.generateBulkReport(accountsData, options, bulkOptions, reportType)

    const filename = generateBulkPDFFilename(reportType, accountsData.length)
    bulkGenerator.save(filename)
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
    // Check if required APIs are available
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
