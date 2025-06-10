export interface CustomerAccount {
  id: string
  patientName: string
  mrn: string
  totalOwed: number
  status: "current" | "overdue" | "paid"
  createdAt: string
  lastPaymentDate?: string
  lastPaymentAmount?: number
  phone?: string
  email?: string
  address?: string
  notes?: string
  dueDate?: string // Added new field for editable due date
}

export interface Payment {
  id: string
  accountId: string
  amount: number
  paymentDate: string
  method: string
  notes?: string
}

export interface CallLog {
  id: string
  accountId: string
  callDate: string
  comments: string
}

export interface PDFExportOptions {
  includeContactInfo: boolean
  includePaymentHistory: boolean
  includeCallHistory: boolean
  includeOutstandingBalance: boolean
  includeAccountSummary: boolean
  includeNotes: boolean
  customTitle?: string
  paymentDateRange?: {
    startDate: string
    endDate: string
  }
  callDateRange?: {
    startDate: string
    endDate: string
  }
}

export interface BulkReportOptions {
  includeDetailedBreakdown: boolean
  includeSummaryStatistics: boolean
  includeContactList: boolean
  includeAgingAnalysis: boolean
  groupByStatus: boolean
  sortBy: "amount" | "name" | "dueDate" | "status"
  sortDirection: "asc" | "desc"
}

export interface ExportSelection {
  mode: "single" | "multiple" | "all"
  accountIds: string[]
  filters: {
    search: string
    status: "all" | "current" | "overdue" | "paid"
    balanceRange: { min?: number; max?: number }
  }
}
