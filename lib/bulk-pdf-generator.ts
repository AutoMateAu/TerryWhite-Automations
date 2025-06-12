"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { CustomerAccount, PDFExportOptions, BulkReportOptions, CallLog, Payment } from "./types"
import type { PatientAccountData } from "./pdf-generator" // Import PatientAccountData

export class BulkPDFGenerator {
  private doc: jsPDF
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })
    this.pageHeight = this.doc.internal.pageSize.height
    this.margin = 15
    this.currentY = this.margin
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  private updateCurrentY(newY: number): void {
    this.currentY = Math.max(this.currentY, newY)
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  generateBulkReport(
    accountsData: PatientAccountData[],
    options: PDFExportOptions,
    bulkOptions: BulkReportOptions,
    reportType: "overdue" | "all" | "current",
  ): void {
    const title = options.customTitle || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Accounts Report`
    this.doc.setProperties({
      title: title,
      subject: `Bulk Report for ${accountsData.length} accounts (${reportType})`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    this.addHeader(title)
    this.addSummaryStatistics(accountsData, reportType)

    accountsData.forEach((data, index) => {
      if (index > 0) {
        this.doc.addPage()
        this.currentY = this.margin
      }

      this.addAccountHeader(data.account)

      if (options.includeAccountSummary) {
        this.addAccountSummarySection(data)
      }
      if (options.includeContactInfo) {
        this.addContactInformationSection(data.account)
      }
      if (options.includeOutstandingBalance) {
        this.addOutstandingBalanceSection(data.account)
      }
      if (options.includePaymentHistory) {
        this.addPaymentHistorySection(data.paymentHistory, options.paymentDateRange)
      }
      if (options.includeCallHistory) {
        this.addCallHistorySection(data.callHistory, options.callDateRange)
      }
      if (options.includeNotes && data.account.notes) {
        this.addNotes(data.account.notes)
      }
    })

    this.addFooter()
  }

  private addHeader(title: string): void {
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(this.margin, this.margin, this.doc.internal.pageSize.width - 2 * this.margin, 25, "F")

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("TerryWhite Chemmart Manly Corso Pharmacy", this.margin + 5, this.margin + 8)

    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("72 The Corso Manly 2095 | Ph: 02 9977 2095", this.margin + 5, this.margin + 14)

    const now = new Date()
    const dateStr = now.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Australia/Sydney",
    })
    const timeStr = now.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Australia/Sydney",
    })
    this.doc.text(
      `Generated: ${dateStr} ${timeStr}`,
      this.doc.internal.pageSize.width - this.margin - 45,
      this.margin + 8,
    )

    this.currentY = this.margin + 30

    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(this.sanitizeText(title), this.margin, this.currentY)
    this.currentY += 10
  }

  private addAccountHeader(account: CustomerAccount): void {
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")

    if (account.status === "overdue") {
      this.doc.setTextColor(220, 53, 69)
    } else if (account.status === "current") {
      this.doc.setTextColor(0, 123, 255)
    } else {
      this.doc.setTextColor(40, 167, 69)
    }

    this.doc.text(`${this.sanitizeText(account.patientName)} (MRN: ${account.mrn})`, this.margin, this.currentY)
    this.currentY += 8

    const statusText = account.status.charAt(0).toUpperCase() + account.status.slice(1)
    this.doc.setFontSize(10)
    this.doc.text(`Status: ${statusText}`, this.margin, this.currentY)
    this.currentY += 8
  }

  private addAccountSummarySection(accountData: PatientAccountData): void {
    this.checkPageBreak(50)

    const account = accountData.account

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Account Summary", this.margin, this.currentY)
    this.currentY += 10

    const accountAge = Math.ceil((new Date().getTime() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24))

    const summaryData = [
      ["Account Created", new Date(account.createdAt).toLocaleDateString("en-AU")],
      ["Account Age", `${accountAge} days`],
      ["Total Owed", `$${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Total Payments", `$${accountData.totalPayments.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: summaryData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
          textColor: [0, 0, 0],
        },
        1: {
          cellWidth: 60,
          textColor: [0, 0, 0],
        },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }

  private addContactInformationSection(account: CustomerAccount): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Contact Information", this.margin, this.currentY)
    this.currentY += 10

    const contactData = [
      ["Patient", this.sanitizeText(account.patientName)],
      ["MRN", account.mrn],
      ["Phone", account.phone || "Not provided"],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: contactData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
          textColor: [0, 0, 0],
        },
        1: {
          cellWidth: 100,
          textColor: [0, 0, 0],
        },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }

  private addCallHistorySection(calls: CallLog[], dateRange?: { startDate: string; endDate: string }): void {
    this.checkPageBreak(60)

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Call History", this.margin, this.currentY)
    this.currentY += 10

    let filteredCalls = calls
    if (dateRange) {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      filteredCalls = calls.filter((call) => {
        const callDate = new Date(call.callDate)
        return callDate >= startDate && callDate <= endDate
      })
    }

    filteredCalls.sort((a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime())

    if (filteredCalls.length === 0) {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No call records found.", this.margin, this.currentY)
      this.currentY += 15
      return
    }

    const callData = filteredCalls.map((call) => {
      const callDate = new Date(call.callDate)
      return [
        callDate.toLocaleDateString("en-AU"),
        callDate.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }),
        this.sanitizeText(call.comments || ""),
      ]
    })

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Date", "Time", "Comments"]],
      body: callData,
      theme: "grid",
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 120 },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }

  private addOutstandingBalanceSection(account: CustomerAccount): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Outstanding Balance", this.margin, this.currentY)
    this.currentY += 10

    let dueDate = "Not Set"
    let status = "N/A"

    if (account.dueDate) {
      dueDate = new Date(account.dueDate).toLocaleDateString("en-AU")
    } else if (account.status !== "paid") {
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const dueDateObj = new Date(baseDate)
      dueDateObj.setDate(dueDateObj.getDate() + 30)
      dueDate = dueDateObj.toLocaleDateString("en-AU")
    }

    if (account.status !== "paid") {
      const dueDateObj = account.dueDate
        ? new Date(account.dueDate)
        : new Date(account.lastPaymentDate || account.createdAt)
      if (account.dueDate || account.lastPaymentDate) {
        dueDateObj.setDate(dueDateObj.getDate() + 30)
      }
      const today = new Date()
      const daysDiff = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (account.status === "overdue") {
        status = `${Math.abs(daysDiff)} days overdue`
      } else {
        status = `${daysDiff} days until due`
      }
    } else {
      status = "Paid in full"
    }

    const balanceData = [
      ["Current", `$${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Due Date", dueDate],
      ["Status", status],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: balanceData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
          textColor: [0, 0, 0],
        },
        1: {
          cellWidth: 60,
          textColor: [0, 0, 0],
        },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }

  private addPaymentHistorySection(payments: Payment[], dateRange?: { startDate: string; endDate: string }): void {
    this.checkPageBreak(60)

    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Payment History", this.margin, this.currentY)
    this.currentY += 10

    let filteredPayments = payments
    if (dateRange) {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      filteredPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate)
        return paymentDate >= startDate && paymentDate <= endDate
      })
    }

    filteredPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

    if (filteredPayments.length === 0) {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No payment records found.", this.margin, this.currentY)
      this.currentY += 15
      return
    }

    const paymentData = filteredPayments.map((payment) => [
      new Date(payment.paymentDate).toLocaleDateString("en-AU"),
      `$${payment.amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      payment.method || "Not specified",
      this.sanitizeText(payment.notes || ""),
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Date", "Amount", "Method", "Notes"]],
      body: paymentData,
      theme: "grid",
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35, halign: "left" },
        2: { cellWidth: 35 },
        3: { cellWidth: 75 },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 10)
      },
    })
  }

  private addNotes(notes: string): void {
    this.checkPageBreak(30)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Notes", this.margin, this.currentY)
    this.currentY += 8

    const sanitizedNotes = this.sanitizeText(notes)
    const splitText = this.doc.splitTextToSize(sanitizedNotes, this.doc.internal.pageSize.width - 2 * this.margin)

    this.doc.text(splitText, this.margin, this.currentY)
    this.currentY += splitText.length * 5 + 5
  }

  private addSummaryStatistics(accountsData: PatientAccountData[], reportType: "overdue" | "all" | "current"): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Summary Statistics", this.margin, this.currentY)
    this.currentY += 8

    const totalAccounts = accountsData.length
    const totalOutstanding = accountsData.reduce((sum, data) => sum + data.account.totalOwed, 0)
    const totalPaid = accountsData.reduce((sum, data) => sum + data.totalPayments, 0)
    const averageBalance = totalAccounts > 0 ? totalOutstanding / totalAccounts : 0

    const overdueCount = accountsData.filter((data) => data.account.status === "overdue").length
    const currentCount = accountsData.filter((data) => data.account.status === "current").length
    const paidCount = accountsData.filter((data) => data.account.status === "paid").length

    const summaryData = [
      ["Total Accounts", totalAccounts.toString()],
      ["Total Outstanding", `$${totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Total Payments", `$${totalPaid.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Average Balance", `$${averageBalance.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Overdue Accounts", `${overdueCount} (${((overdueCount / totalAccounts) * 100).toFixed(1)}%)`],
      ["Current Accounts", `${currentCount} (${((currentCount / totalAccounts) * 100).toFixed(1)}%)`],
      ["Paid Accounts", `${paidCount} (${((paidCount / totalAccounts) * 100).toFixed(1)}%)`],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: summaryData,
      theme: "plain",
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 60 },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)

      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.doc.internal.pageSize.width - this.margin,
        this.pageHeight - 15,
      )

      this.doc.setFontSize(8)
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("Confidential - Pharmacy Management System", this.margin, this.pageHeight - 8)
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.doc.internal.pageSize.width - this.margin - 20,
        this.pageHeight - 8,
      )
    }
  }

  save(filename: string): void {
    this.doc.save(filename)
  }

  output(type: "blob"): Blob {
    return this.doc.output(type)
  }
}

export function generateBulkPDFFilename(reportType: "overdue" | "all" | "current", accountCount: number): string {
  const date = new Date().toISOString().split("T")[0]
  const typeSuffix = reportType.charAt(0).toUpperCase() + reportType.slice(1)
  return `${typeSuffix}-Accounts-Report-${accountCount}-accounts-${date}.pdf`
}

export function processAccountsInBatches<T>(accounts: T[], batchSize = 50, processor: (batch: T[]) => void): void {
  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize)
    processor(batch)
  }
}
