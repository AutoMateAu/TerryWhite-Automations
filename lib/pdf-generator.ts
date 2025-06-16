"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type {
  CustomerAccount,
  Payment,
  CallLog,
  PDFExportOptions,
  PatientProfile,
  DischargedPatient,
  Medication,
  PatientDocument,
} from "./types"

export interface PatientAccountData {
  account: CustomerAccount
  paymentHistory: Payment[]
  callHistory: CallLog[]
  totalPayments: number
  lastCallDate?: string
  accountAge: number
}

export class PDFGenerator {
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
    if (typeof text !== "string") return "" // Ensure text is a string
    return text
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  generateSingleAccountPDF(accountData: PatientAccountData, options: PDFExportOptions): void {
    const account = accountData.account

    // Set document properties
    const title = options.customTitle || `Account Report - ${account.patientName}`
    this.doc.setProperties({
      title: title,
      subject: `Account Report for ${account.patientName}`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    // Add header
    this.addHeader(title)

    // Add sections based on selected options
    if (options.includeAccountSummary) {
      this.addAccountSummarySection(accountData)
    }

    if (options.includeContactInfo) {
      this.addContactInformationSection(account)
    }

    if (options.includeCallHistory) {
      this.addCallHistorySection(accountData.callHistory, options.callDateRange)
    }

    if (options.includeOutstandingBalance) {
      this.addOutstandingBalanceSection(account)
    }

    if (options.includePaymentHistory) {
      this.addPaymentHistorySection(accountData.paymentHistory, options.paymentDateRange)
    }

    // Add notes if enabled and available
    if (options.includeNotes && account.notes) {
      this.addNotes(account.notes)
    }

    // Add footer
    this.addFooter()
  }

  generateMultipleAccountsPDF(accountsData: PatientAccountData[], options: PDFExportOptions): void {
    // Set document properties
    const title = options.customTitle || `Multiple Accounts Report`
    this.doc.setProperties({
      title: title,
      subject: `Report for ${accountsData.length} accounts`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    // Add header
    this.addHeader(title)

    // Add summary statistics
    this.addSummaryStatistics(accountsData)

    // Process each account
    accountsData.forEach((data, index) => {
      // Add page break between accounts
      if (index > 0) {
        this.doc.addPage()
        this.currentY = this.margin
      }

      // Add account header
      this.addAccountHeader(data.account)

      // Add sections based on selected options
      if (options.includeAccountSummary) {
        this.addAccountSummarySection(data)
      }

      if (options.includeContactInfo) {
        this.addContactInformationSection(data.account)
      }

      if (options.includeCallHistory) {
        this.addCallHistorySection(data.callHistory, options.callDateRange)
      }

      if (options.includeOutstandingBalance) {
        this.addOutstandingBalanceSection(data.account)
      }

      if (options.includePaymentHistory) {
        this.addPaymentHistorySection(data.paymentHistory, options.paymentDateRange)
      }

      // Add notes if enabled and available
      if (options.includeNotes && data.account.notes) {
        this.addNotes(data.account.notes)
      }
    })

    // Add footer
    this.addFooter()
  }

  // NEW: Comprehensive Patient Report Generation
  generatePatientReportPDF(
    patient: PatientProfile,
    account: CustomerAccount | null,
    currentMedications: Medication[],
    dischargeSummaries: DischargedPatient[],
    paymentHistory: Payment[],
    callHistory: CallLog[],
    patientDocuments: PatientDocument[],
    notes: string,
  ): void {
    const title = `Patient Report - ${patient.name}`
    this.doc.setProperties({
      title: title,
      subject: `Comprehensive Report for ${patient.name}`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    this.addHeader(title)
    this.addPatientDetailsSection(patient)
    this.addCurrentMedicationsSection(currentMedications)
    this.addMedicationHistorySection(dischargeSummaries)
    this.addAdmissionsSection(dischargeSummaries)
    if (account) {
      this.addAccountingSummarySection(account, paymentHistory, callHistory)
    }
    this.addNotes(notes)
    this.addDocumentsSection(patientDocuments)

    this.addFooter()
  }

  // NEW: Patient Signing Sheet Generation
  generateSigningSheetPDF(patient: PatientProfile, patientNotes: string): void {
    const title = `Patient Signing Sheet - ${patient.name}`
    this.doc.setProperties({
      title: title,
      subject: `Signing Sheet for ${patient.name}`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    this.addHeader(title)

    this.checkPageBreak(80)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Patient Information", this.margin, this.currentY)
    this.currentY += 10

    const patientInfoData = [
      ["Patient Name", this.sanitizeText(patient.name)],
      ["MRN", patient.mrn],
      ["Date of Birth", new Date(patient.dob).toLocaleDateString("en-AU")],
      ["Address", this.sanitizeText(patient.address)],
      ["Phone Number", patient.phone || "Not provided"],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: patientInfoData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45, textColor: [0, 0, 0] },
        1: { cellWidth: 120, textColor: [0, 0, 0] },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })

    this.checkPageBreak(100)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Acknowledgement and Signature", this.margin, this.currentY)
    this.currentY += 10

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    const acknowledgementText =
      "I, the undersigned, acknowledge receipt of my medications and confirm that I have received appropriate counseling regarding their use, potential side effects, and storage. I understand my medication regimen and have had the opportunity to ask any questions."
    const splitAckText = this.doc.splitTextToSize(
      acknowledgementText,
      this.doc.internal.pageSize.width - 2 * this.margin,
    )
    this.doc.text(splitAckText, this.margin, this.currentY)
    this.currentY += splitAckText.length * 5 + 15

    // Signature lines
    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    this.doc.text("Patient/Guardian Signature:", this.margin, this.currentY)
    this.doc.line(this.margin + 50, this.currentY, this.doc.internal.pageSize.width - this.margin, this.currentY)
    this.currentY += 10

    this.doc.text("Printed Name:", this.margin, this.currentY)
    this.doc.line(this.margin + 50, this.currentY, this.doc.internal.pageSize.width - this.margin, this.currentY)
    this.currentY += 10

    this.doc.text("Date:", this.margin, this.currentY)
    this.doc.line(this.margin + 50, this.currentY, this.doc.internal.pageSize.width - this.margin, this.currentY)
    this.currentY += 10

    this.doc.text("Time:", this.margin, this.currentY)
    this.doc.line(this.margin + 50, this.currentY, this.doc.internal.pageSize.width - this.margin, this.currentY)
    this.currentY += 15

    if (patientNotes) {
      this.checkPageBreak(40)
      this.doc.setFontSize(12)
      this.doc.setTextColor(0, 0, 0)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Additional Notes:", this.margin, this.currentY)
      this.currentY += 8

      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      const splitNotes = this.doc.splitTextToSize(
        this.sanitizeText(patientNotes),
        this.doc.internal.pageSize.width - 2 * this.margin,
      )
      this.doc.text(splitNotes, this.margin, this.currentY)
      this.currentY += splitNotes.length * 5 + 5
    }

    this.addFooter()
  }

  private addHeader(title: string): void {
    // Company header background
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(this.margin, this.margin, this.doc.internal.pageSize.width - 2 * this.margin, 25, "F")

    // Company name
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("TerryWhite Chemmart Manly Corso Pharmacy", this.margin + 5, this.margin + 8)

    // Contact info
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("72 The Corso Manly 2095 | Ph: 02 9977 2095", this.margin + 5, this.margin + 14)

    // Date and time
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

    // Report title
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(this.sanitizeText(title), this.margin, this.currentY)
    this.currentY += 10
  }

  private addAccountHeader(account: CustomerAccount): void {
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")

    // Set color based on account status
    if (account.status === "overdue") {
      this.doc.setTextColor(220, 53, 69) // Red
    } else if (account.status === "current") {
      this.doc.setTextColor(0, 123, 255) // Blue
    } else {
      this.doc.setTextColor(40, 167, 69) // Green
    }

    this.doc.text(`${this.sanitizeText(account.patientName)} (MRN: ${account.mrn})`, this.margin, this.currentY)
    this.currentY += 8

    // Status badge
    const statusText = account.status.charAt(0).toUpperCase() + account.status.slice(1)
    this.doc.setFontSize(10)
    this.doc.text(`Status: ${statusText}`, this.margin, this.currentY)
    this.currentY += 8
  }

  private addAccountSummarySection(accountData: PatientAccountData): void {
    this.checkPageBreak(50)

    const account = accountData.account

    // Account Summary subheading
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Account Summary", this.margin, this.currentY)
    this.currentY += 10

    // Calculate account age in days
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

    // Contact Information subheading
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

    // Call History subheading
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Call History", this.margin, this.currentY)
    this.currentY += 10

    // Filter and sort calls
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

    // Outstanding Balance subheading
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Outstanding Balance", this.margin, this.currentY)
    this.currentY += 10

    // Calculate due date and status
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

    // Payment History subheading
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Payment History", this.margin, this.currentY)
    this.currentY += 10

    // Filter and sort payments
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

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    // Split notes into paragraphs and handle line breaks
    const sanitizedNotes = this.sanitizeText(notes)
    const splitText = this.doc.splitTextToSize(sanitizedNotes, this.doc.internal.pageSize.width - 2 * this.margin)

    this.doc.text(splitText, this.margin, this.currentY)
    this.currentY += splitText.length * 5 + 5
  }

  private addSummaryStatistics(accountsData: PatientAccountData[]): void {
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

    // Count accounts by status
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

      // Footer line
      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.doc.internal.pageSize.width - this.margin,
        this.pageHeight - 15,
      )

      // Footer text
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

  // NEW: Expose the jspdf output method
  output(type: "blob"): Blob {
    return this.doc.output(type)
  }

  // NEW: Add Patient Details Section
  private addPatientDetailsSection(patient: PatientProfile): void {
    this.checkPageBreak(70)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Patient Details", this.margin, this.currentY)
    this.currentY += 10

    const patientDetailsData = [
      ["Name", this.sanitizeText(patient.name)],
      ["DOB", new Date(patient.dob).toLocaleDateString("en-AU")],
      ["MRN", patient.mrn],
      ["Phone", patient.phone || "Not provided"],
      ["Address", this.sanitizeText(patient.address)],
      ["Medicare", patient.medicare],
      ["Allergies", this.sanitizeText(patient.allergies)],
      ["Patient Group", patient.patientGroup || "N/A"],
      ["Patient Status", patient.status || "N/A"],
      ["PPA Funding", patient.ppaFundingInfo || "N/A"],
      ["Doctor", patient.doctorsName || "N/A"],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: patientDetailsData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45, textColor: [0, 0, 0] },
        1: { cellWidth: 120, textColor: [0, 0, 0] },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }

  // NEW: Add Current Medications Section
  private addCurrentMedicationsSection(medications: Medication[]): void {
    this.checkPageBreak(100)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Current Medications", this.margin, this.currentY)
    this.currentY += 10

    const packedDrugs = medications.filter((med) => med.isPacked)
    const nonPackedDrugs = medications.filter((med) => !med.isPacked)

    if (packedDrugs.length > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Packed Drugs:", this.margin, this.currentY)
      this.currentY += 8
      this.addMedicationTable(packedDrugs)
    } else {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No packed medications.", this.margin, this.currentY)
      this.currentY += 10
    }

    this.checkPageBreak(100) // Check for page break before non-packed drugs
    if (nonPackedDrugs.length > 0) {
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text("Non-Packed Drugs:", this.margin, this.currentY)
      this.currentY += 8
      this.addMedicationTable(nonPackedDrugs)
    } else {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No non-packed medications.", this.margin, this.currentY)
      this.currentY += 10
    }
    this.currentY += 5 // Add some space after medication tables
  }

  // Helper for medication tables
  private addMedicationTable(medications: Medication[]): void {
    const medicationData = medications.map((med) => [
      this.sanitizeText(med.name),
      this.sanitizeText(med.directions || "N/A"),
      this.sanitizeText(med.pack || "N/A"),
      med.startDate ? new Date(med.startDate).toLocaleDateString("en-AU") : "N/A",
      med.endDate ? new Date(med.endDate).toLocaleDateString("en-AU") : "N/A",
      this.sanitizeText(med.frequency || "N/A"),
      this.sanitizeText(med.category || "N/A"),
      this.sanitizeText(med.note || "N/A"),
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Drug", "Directions", "Pack", "Start Date", "End Date", "Frequency", "Category", "Note"]],
      body: medicationData,
      theme: "grid",
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 30 },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })
  }

  // NEW: Add Medication History Section
  private addMedicationHistorySection(dischargeSummaries: DischargedPatient[]): void {
    this.checkPageBreak(60)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Medication History", this.margin, this.currentY)
    this.currentY += 10

    if (dischargeSummaries.length === 0) {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No previous medication records found.", this.margin, this.currentY)
      this.currentY += 15
      return
    }

    dischargeSummaries.forEach((form) => {
      this.checkPageBreak(30 + form.medications.length * 5) // Estimate space needed
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(
        `Medications from ${new Date(form.dischargeTimestamp).toLocaleDateString("en-AU")}`,
        this.margin,
        this.currentY,
      )
      this.currentY += 7

      if (form.medications.length === 0) {
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "italic")
        this.doc.setTextColor(128, 128, 128)
        this.doc.text("No medications listed in this summary.", this.margin, this.currentY)
        this.currentY += 5
      } else {
        form.medications.forEach((med: Medication) => {
          this.doc.setFontSize(10)
          this.doc.setFont("helvetica", "normal")
          const medText = `${this.sanitizeText(med.name)}: ${this.sanitizeText(med.dosageFrequency || med.status || "N/A")}${med.comments ? ` (${this.sanitizeText(med.comments)})` : ""}`
          const splitText = this.doc.splitTextToSize(medText, this.doc.internal.pageSize.width - 2 * this.margin - 10) // Indent for list
          this.doc.text(`• ${splitText.join("\n• ")}`, this.margin + 5, this.currentY)
          this.currentY += splitText.length * 4.5
        })
      }
      this.currentY += 5
    })
    this.currentY += 5 // Add some space after history
  }

  // NEW: Add Admissions Section
  private addAdmissionsSection(dischargeSummaries: DischargedPatient[]): void {
    this.checkPageBreak(60)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Admissions History", this.margin, this.currentY)
    this.currentY += 10

    const admissions = dischargeSummaries
      .filter((form) => form.admissionDate)
      .sort((a, b) => new Date(b.admissionDate!).getTime() - new Date(a.admissionDate!).getTime())

    if (admissions.length === 0) {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No admission records found for this patient.", this.margin, this.currentY)
      this.currentY += 15
      return
    }

    admissions.forEach((form) => {
      this.checkPageBreak(40)
      this.doc.setFontSize(12)
      this.doc.setFont("helvetica", "bold")
      this.doc.text(
        `Admission on ${new Date(form.admissionDate!).toLocaleDateString("en-AU")}`,
        this.margin,
        this.currentY,
      )
      this.currentY += 7

      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      if (form.dischargeDate) {
        this.doc.text(
          `Discharged on: ${new Date(form.dischargeDate).toLocaleDateString("en-AU")}`,
          this.margin + 5,
          this.currentY,
        )
        this.currentY += 5
      }
      if (form.hospitalName) {
        this.doc.text(`Hospital: ${this.sanitizeText(form.hospitalName)}`, this.margin + 5, this.currentY)
        this.currentY += 5
      }
      this.doc.text(
        `Reason for Admission: ${this.sanitizeText(form.reasonForAdmission || "N/A")}`,
        this.margin + 5,
        this.currentY,
      )
      this.currentY += 5
      this.doc.text(`Pharmacist: ${this.sanitizeText(form.pharmacist || "N/A")}`, this.margin + 5, this.currentY)
      this.currentY += 8
    })
    this.currentY += 5 // Add some space after admissions
  }

  // NEW: Add Accounting Summary Section (adapted from existing logic)
  private addAccountingSummarySection(
    account: CustomerAccount,
    paymentHistory: Payment[],
    callHistory: CallLog[],
  ): void {
    this.checkPageBreak(100)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Accounting Summary", this.margin, this.currentY)
    this.currentY += 10

    const getStatusText = (status: CustomerAccount["status"]) => {
      switch (status) {
        case "current":
        case "paid":
          return "Up to Date"
        case "overdue":
          return "Overdue"
        default:
          return "N/A"
      }
    }

    const accountingSummaryData = [
      ["Total Amount Owed", `$${account.totalOwed.toFixed(2)}`],
      ["Payment Status", getStatusText(account.status)],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      body: accountingSummaryData,
      theme: "plain",
      styles: {
        fontSize: 11,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: [0, 0, 0] },
        1: { cellWidth: 80, textColor: [0, 0, 0] },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 10)
      },
    })

    this.checkPageBreak(60)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Payment History", this.margin, this.currentY)
    this.currentY += 8

    if (paymentHistory.length === 0) {
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No payment records found.", this.margin, this.currentY)
      this.currentY += 10
    } else {
      const paymentData = paymentHistory.map((payment) => [
        new Date(payment.paymentDate).toLocaleDateString("en-AU"),
        `$${payment.amount.toFixed(2)}`,
        this.sanitizeText(payment.method || "Not specified"),
        this.sanitizeText(payment.notes || ""),
      ])
      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Date", "Amount", "Method", "Notes"]],
        body: paymentData,
        theme: "grid",
        headStyles: { fillColor: [64, 64, 64], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25, halign: "left" },
          2: { cellWidth: 25 },
          3: { cellWidth: 80 },
        },
        didDrawPage: (data) => {
          this.updateCurrentY(data.cursor.y + 5)
        },
      })
    }

    this.checkPageBreak(60)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Call History", this.margin, this.currentY)
    this.currentY += 8

    if (callHistory.length === 0) {
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No call records found.", this.margin, this.currentY)
      this.currentY += 10
    } else {
      const callData = callHistory.map((call) => [
        new Date(call.callDate).toLocaleDateString("en-AU"),
        new Date(call.callDate).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }),
        this.sanitizeText(call.comments || ""),
      ])
      autoTable(this.doc, {
        startY: this.currentY,
        head: [["Date", "Time", "Comments"]],
        body: callData,
        theme: "grid",
        headStyles: { fillColor: [64, 64, 64], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: this.margin, right: this.margin },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 20 }, 2: { cellWidth: 120 } },
        didDrawPage: (data) => {
          this.updateCurrentY(data.cursor.y + 5)
        },
      })
    }
    this.currentY += 5 // Add some space after accounting
  }

  // NEW: Add Documents Section
  private addDocumentsSection(documents: PatientDocument[]): void {
    this.checkPageBreak(40)
    this.doc.setFontSize(14)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Uploaded Documents", this.margin, this.currentY)
    this.currentY += 10

    if (documents.length === 0) {
      this.doc.setFontSize(11)
      this.doc.setFont("helvetica", "italic")
      this.doc.setTextColor(128, 128, 128)
      this.doc.text("No documents uploaded for this patient.", this.margin, this.currentY)
      this.currentY += 15
      return
    }

    const documentData = documents.map((doc) => [
      this.sanitizeText(doc.fileName),
      doc.fileType || "N/A",
      new Date(doc.uploadDate).toLocaleDateString("en-AU"),
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["File Name", "File Type", "Upload Date"]],
      body: documentData,
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
        0: { cellWidth: 80 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 15)
      },
    })
  }
}

export function generatePDFFilename(
  type: "single" | "multiple" | "patient-report" | "signing-sheet",
  patientName?: string,
  suffix = "multiple",
): string {
  const date = new Date().toISOString().split("T")[0]

  if (type === "single" && patientName) {
    const sanitizedName = patientName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    return `account-report-${sanitizedName}-${date}.pdf`
  } else if (type === "patient-report" && patientName) {
    const sanitizedName = patientName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    return `patient-report-${sanitizedName}-${date}.pdf`
  } else if (type === "signing-sheet" && patientName) {
    const sanitizedName = patientName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    return `signing-sheet-${sanitizedName}-${date}.pdf`
  } else {
    return `accounts-report-${suffix || "multiple"}-${date}.pdf`
  }
}

// Performance optimization: Process accounts in batches
export function processAccountsInBatches<T>(accounts: T[], batchSize = 50, processor: (batch: T[]) => void): void {
  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize)
    processor(batch)
  }
}
