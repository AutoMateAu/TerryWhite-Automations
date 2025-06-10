"use client"

import type { PDFExportOptions, PatientAccountData, BulkReportOptions } from "@/lib/types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export class BulkPDFGenerator {
  private doc: jsPDF
  private currentY: number
  private pageHeight: number
  private margin: number

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

  generateBulkReport(
    accountsData: PatientAccountData[],
    options: PDFExportOptions,
    bulkOptions: BulkReportOptions,
    reportType: "overdue" | "all" | "current",
  ): void {
    // Set document properties
    const title = options.customTitle || this.getReportTitle(reportType)
    this.doc.setProperties({
      title: title,
      subject: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Accounts Report`,
      author: "Pharmacy Management System",
      creator: "Pharmacy Management System",
    })

    // Add header
    this.addHeader(title, accountsData, reportType)

    // Add summary statistics if enabled
    if (bulkOptions.includeSummaryStatistics) {
      this.addSummaryStatistics(accountsData, reportType)
    }

    // Add aging analysis if enabled
    if (bulkOptions.includeAgingAnalysis && reportType !== "current") {
      this.addAgingAnalysis(accountsData)
    }

    // Add contact list if enabled
    if (bulkOptions.includeContactList) {
      this.addContactList(accountsData)
    }

    // Sort accounts based on options
    const sortedAccounts = this.sortAccounts(accountsData, bulkOptions.sortBy, bulkOptions.sortDirection)

    // Add detailed breakdown if enabled
    if (bulkOptions.includeDetailedBreakdown) {
      if (bulkOptions.groupByStatus) {
        this.addGroupedDetailedBreakdown(sortedAccounts, options)
      } else {
        this.addDetailedBreakdown(sortedAccounts, options)
      }
    }

    // Add footer with page numbers
    const totalPages = this.doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.addFooter(i, totalPages)
    }
  }

  private getReportTitle(reportType: "overdue" | "all" | "current"): string {
    switch (reportType) {
      case "overdue":
        return "Overdue Accounts Report"
      case "current":
        return "Current Accounts Report"
      case "all":
        return "All Accounts Report"
      default:
        return "Accounts Report"
    }
  }

  private addHeader(
    title: string,
    accountsData: PatientAccountData[],
    reportType: "overdue" | "all" | "current",
  ): void {
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

    // Set color based on report type
    switch (reportType) {
      case "overdue":
        this.doc.setTextColor(220, 53, 69) // Red
        break
      case "current":
        this.doc.setTextColor(0, 123, 255) // Blue
        break
      default:
        this.doc.setTextColor(73, 80, 87) // Dark gray
    }

    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8

    // Subtitle
    this.doc.setFontSize(10)
    this.doc.setTextColor(108, 117, 125)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Report contains ${accountsData.length} accounts`, this.margin, this.currentY)
    this.currentY += 10
  }

  private addSummaryStatistics(accountsData: PatientAccountData[], reportType: "overdue" | "all" | "current"): void {
    this.checkPageBreak(60)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Executive Summary", this.margin, this.currentY)
    this.currentY += 8

    const totalAccounts = accountsData.length
    const totalOutstanding = accountsData.reduce((sum, data) => sum + data.account.totalOwed, 0)
    const totalPaid = accountsData.reduce((sum, data) => sum + data.totalPayments, 0)
    const averageBalance = totalAccounts > 0 ? totalOutstanding / totalAccounts : 0

    // Count accounts by status
    const overdueCount = accountsData.filter((data) => data.account.status === "overdue").length
    const currentCount = accountsData.filter((data) => data.account.status === "current").length
    const paidCount = accountsData.filter((data) => data.account.status === "paid").length

    // Create summary data based on report type
    const summaryData: string[][] = [
      ["Total Accounts", totalAccounts.toString()],
      ["Total Outstanding", `$${totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Total Payments Received", `$${totalPaid.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
      ["Average Balance", `$${averageBalance.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`],
    ]

    if (reportType === "all") {
      summaryData.push(
        ["Overdue Accounts", `${overdueCount} (${((overdueCount / totalAccounts) * 100).toFixed(1)}%)`],
        ["Current Accounts", `${currentCount} (${((currentCount / totalAccounts) * 100).toFixed(1)}%)`],
        ["Paid Accounts", `${paidCount} (${((paidCount / totalAccounts) * 100).toFixed(1)}%)`],
      )
    } else if (reportType === "overdue") {
      const overdueTotal = accountsData.reduce(
        (sum, data) => (data.account.status === "overdue" ? sum + data.account.totalOwed : sum),
        0,
      )
      summaryData.push([
        "Total Overdue Amount",
        `$${overdueTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      ])
    }

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [73, 80, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: "auto",
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "bold" },
        1: { cellWidth: 80 },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })
  }

  private addAgingAnalysis(accountsData: PatientAccountData[]): void {
    const overdueAccounts = accountsData.filter((data) => data.account.status === "overdue")
    if (overdueAccounts.length === 0) return

    this.checkPageBreak(50)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Aging Analysis", this.margin, this.currentY)
    this.currentY += 8

    // Calculate aging buckets
    const today = new Date()
    const agingBuckets = {
      "1-30": { count: 0, amount: 0 },
      "31-60": { count: 0, amount: 0 },
      "61-90": { count: 0, amount: 0 },
      "90+": { count: 0, amount: 0 },
    }

    overdueAccounts.forEach((data) => {
      const baseDate = data.account.lastPaymentDate
        ? new Date(data.account.lastPaymentDate)
        : new Date(data.account.createdAt)
      const dueDate = new Date(baseDate)
      dueDate.setDate(dueDate.getDate() + 30)
      const daysOverdue = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      const amount = data.account.totalOwed

      if (daysOverdue <= 30) {
        agingBuckets["1-30"].count++
        agingBuckets["1-30"].amount += amount
      } else if (daysOverdue <= 60) {
        agingBuckets["31-60"].count++
        agingBuckets["31-60"].amount += amount
      } else if (daysOverdue <= 90) {
        agingBuckets["61-90"].count++
        agingBuckets["61-90"].amount += amount
      } else {
        agingBuckets["90+"].count++
        agingBuckets["90+"].amount += amount
      }
    })

    const totalOverdueAmount = overdueAccounts.reduce((sum, data) => sum + data.account.totalOwed, 0)

    const agingData = [
      [
        "1-30 Days",
        agingBuckets["1-30"].count.toString(),
        `$${agingBuckets["1-30"].amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
        `${((agingBuckets["1-30"].amount / totalOverdueAmount) * 100).toFixed(1)}%`,
      ],
      [
        "31-60 Days",
        agingBuckets["31-60"].count.toString(),
        `$${agingBuckets["31-60"].amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
        `${((agingBuckets["31-60"].amount / totalOverdueAmount) * 100).toFixed(1)}%`,
      ],
      [
        "61-90 Days",
        agingBuckets["61-90"].count.toString(),
        `$${agingBuckets["61-90"].amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
        `${((agingBuckets["61-90"].amount / totalOverdueAmount) * 100).toFixed(1)}%`,
      ],
      [
        "90+ Days",
        agingBuckets["90+"].count.toString(),
        `$${agingBuckets["90+"].amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
        `${((agingBuckets["90+"].amount / totalOverdueAmount) * 100).toFixed(1)}%`,
      ],
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Age Period", "Count", "Amount", "% of Total"]],
      body: agingData,
      theme: "grid",
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 30, halign: "center" },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })
  }

  private addContactList(accountsData: PatientAccountData[]): void {
    const accountsWithPhones = accountsData.filter((data) => data.account.phone)
    if (accountsWithPhones.length === 0) return

    this.checkPageBreak(40)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Contact Directory", this.margin, this.currentY)
    this.currentY += 8

    const contactData = accountsWithPhones
      .slice(0, 20)
      .map((data) => [
        data.account.patientName,
        data.account.phone || "N/A",
        data.account.status.charAt(0).toUpperCase() + data.account.status.slice(1),
        `$${data.account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [["Patient Name", "Phone", "Status", "Balance"]],
      body: contactData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })

    if (accountsWithPhones.length > 20) {
      this.doc.setFontSize(8)
      this.doc.setTextColor(108, 117, 125)
      this.doc.text(
        `Showing first 20 of ${accountsWithPhones.length} accounts with phone numbers`,
        this.margin,
        this.currentY,
      )
      this.currentY += 5
    }
  }

  private addDetailedBreakdown(accountsData: PatientAccountData[], options: PDFExportOptions): void {
    this.checkPageBreak(40)

    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Account Details", this.margin, this.currentY)
    this.currentY += 8

    // Create headers based on options
    const headers = ["Patient Name", "MRN", "Status", "Balance"]
    if (options.includeContactInfo) {
      headers.push("Phone")
    }
    headers.push("Last Payment", "Days Since Payment")

    const tableData = accountsData.map((data) => {
      const account = data.account
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const daysSincePayment = Math.floor((new Date().getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))

      const row = [
        account.patientName,
        account.mrn,
        account.status.charAt(0).toUpperCase() + account.status.slice(1),
        `$${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      ]

      if (options.includeContactInfo) {
        row.push(account.phone || "N/A")
      }

      row.push(
        account.lastPaymentDate ? new Date(account.lastPaymentDate).toLocaleDateString("en-AU") : "No payments",
        daysSincePayment.toString(),
      )

      return row
    })

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [73, 80, 87],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: options.includeContactInfo ? 35 : 45 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 25, halign: "right" },
        ...(options.includeContactInfo
          ? { 4: { cellWidth: 30 }, 5: { cellWidth: 25 }, 6: { cellWidth: 20, halign: "center" } }
          : { 4: { cellWidth: 30 }, 5: { cellWidth: 20, halign: "center" } }),
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 5)
      },
    })
  }

  private addGroupedDetailedBreakdown(accountsData: PatientAccountData[], options: PDFExportOptions): void {
    const groupedAccounts = this.groupAccountsByStatus(accountsData)
    const statusOrder = ["overdue", "current", "paid"]

    statusOrder.forEach((status) => {
      if (groupedAccounts[status] && groupedAccounts[status].length > 0) {
        this.checkPageBreak(30)

        // Status header
        this.doc.setFontSize(11)
        this.doc.setFont("helvetica", "bold")

        // Set color based on status
        if (status === "overdue") {
          this.doc.setTextColor(220, 53, 69)
        } else if (status === "current") {
          this.doc.setTextColor(0, 123, 255)
        } else {
          this.doc.setTextColor(40, 167, 69)
        }

        const statusText = status.charAt(0).toUpperCase() + status.slice(1)
        this.doc.text(`${statusText} Accounts (${groupedAccounts[status].length})`, this.margin, this.currentY)
        this.currentY += 6

        // Add accounts table for this status
        this.addStatusAccountsTable(groupedAccounts[status], options, status)
      }
    })
  }

  private addStatusAccountsTable(accountsData: PatientAccountData[], options: PDFExportOptions, status: string): void {
    const headers = ["Patient Name", "MRN", "Balance"]
    if (options.includeContactInfo) {
      headers.push("Phone")
    }
    headers.push("Last Payment")

    const tableData = accountsData.map((data) => {
      const account = data.account
      const row = [
        account.patientName,
        account.mrn,
        `$${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`,
      ]

      if (options.includeContactInfo) {
        row.push(account.phone || "N/A")
      }

      row.push(account.lastPaymentDate ? new Date(account.lastPaymentDate).toLocaleDateString("en-AU") : "No payments")

      return row
    })

    // Set colors based on status
    let fillColor: number[]
    let altFillColor: number[]

    if (status === "overdue") {
      fillColor = [220, 53, 69]
      altFillColor = [255, 245, 245]
    } else if (status === "current") {
      fillColor = [0, 123, 255]
      altFillColor = [240, 248, 255]
    } else {
      fillColor = [40, 167, 69]
      altFillColor = [245, 255, 245]
    }

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: fillColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: altFillColor,
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        0: { cellWidth: options.includeContactInfo ? 40 : 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25, halign: "right" },
        ...(options.includeContactInfo ? { 3: { cellWidth: 35 }, 4: { cellWidth: 35 } } : { 3: { cellWidth: 40 } }),
      },
      didDrawPage: (data) => {
        this.updateCurrentY(data.cursor.y + 8)
      },
    })
  }

  private addFooter(currentPage: number, totalPages: number): void {
    this.doc.setFontSize(8)
    this.doc.setTextColor(128, 128, 128)

    // Footer line
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(
      this.margin,
      this.pageHeight - 15,
      this.doc.internal.pageSize.width - this.margin,
      this.pageHeight - 15,
    )

    // Footer text
    this.doc.text("Confidential - Pharmacy Management System", this.margin, this.pageHeight - 8)
    this.doc.text(
      `Page ${currentPage} of ${totalPages}`,
      this.doc.internal.pageSize.width - this.margin - 20,
      this.pageHeight - 8,
    )
  }

  private sortAccounts(
    accountsData: PatientAccountData[],
    sortBy: "amount" | "name" | "dueDate" | "status",
    sortDirection: "asc" | "desc",
  ): PatientAccountData[] {
    return [...accountsData].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "amount":
          comparison = a.account.totalOwed - b.account.totalOwed
          break
        case "name":
          comparison = a.account.patientName.localeCompare(b.account.patientName)
          break
        case "status":
          const statusOrder = { overdue: 0, current: 1, paid: 2 }
          comparison = statusOrder[a.account.status] - statusOrder[b.account.status]
          break
        case "dueDate":
          const aBaseDate = a.account.lastPaymentDate
            ? new Date(a.account.lastPaymentDate)
            : new Date(a.account.createdAt)
          const bBaseDate = b.account.lastPaymentDate
            ? new Date(b.account.lastPaymentDate)
            : new Date(b.account.createdAt)

          const aDueDate = new Date(aBaseDate)
          aDueDate.setDate(aDueDate.getDate() + 30)

          const bDueDate = new Date(bBaseDate)
          bDueDate.setDate(bDueDate.getDate() + 30)

          comparison = aDueDate.getTime() - bDueDate.getTime()
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  private groupAccountsByStatus(accountsData: PatientAccountData[]): Record<string, PatientAccountData[]> {
    return accountsData.reduce(
      (groups, account) => {
        const status = account.account.status
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(account)
        return groups
      },
      {} as Record<string, PatientAccountData[]>,
    )
  }

  save(filename: string): void {
    this.doc.save(filename)
  }
}

export function generateBulkPDFFilename(reportType: "overdue" | "all" | "current", accountCount: number): string {
  const date = new Date().toISOString().split("T")[0]
  const typePrefix = reportType.charAt(0).toUpperCase() + reportType.slice(1)
  return `${typePrefix}-Accounts-Report-${accountCount}-accounts-${date}.pdf`
}
