"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  FileText,
  DollarSign,
  Calendar,
  CreditCard,
  History,
  Database,
  AlertTriangle,
  PhoneCall,
  Edit,
} from "lucide-react"
import type { CustomerAccount, DischargedPatient } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { RecordPaymentForm } from "@/components/record-payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { CallHistory } from "@/components/call-history"
import { AddCallLogForm } from "@/components/add-call-log-form"
import {
  getCustomerAccounts,
  getDischargeFormsForCustomer,
  checkTablesExist,
  updateAccountDueDate,
} from "@/services/accounting-service"
import { createClient } from "@/utils/supabase/client"
import { SetupGuide } from "@/components/setup-guide"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Phone, Users } from "lucide-react"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog"
import { EnhancedExportDialog } from "@/components/enhanced-export-dialog"
import { EditDueDateDialog } from "@/components/edit-due-date-dialog" // Import the new dialog
import { format } from "date-fns"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, X, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null)
  const [dischargeForm, setDischargeForm] = useState<DischargedPatient | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [isAddCallDialogOpen, setIsAddCallDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [sortField, setSortField] = useState<"amount" | "status" | "dueDate" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<"all" | "current" | "overdue" | "paid">("all")

  const [showOverdueReport, setShowOverdueReport] = useState(false)
  const [isPDFExportDialogOpen, setIsPDFExportDialogOpen] = useState(false)
  const [isBulkPDFDialogOpen, setIsBulkPDFDialogOpen] = useState(false)
  const [bulkReportType, setBulkReportType] = useState<"overdue" | "all" | "current">("all")
  const [isEnhancedExportDialogOpen, setIsEnhancedExportDialogOpen] = useState(false)
  const [isEditDueDateDialogOpen, setIsEditDueDateDialogOpen] = useState(false) // New state for due date dialog
  const [selectedAccountForDueDate, setSelectedAccountForDueDate] = useState<CustomerAccount | null>(null) // New state for selected account for due date

  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined)
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false)
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccounts() {
      try {
        // Check if tables exist
        const tablesExist = await checkTablesExist()
        setIsUsingMockData(!tablesExist)

        // Get accounts (will return mock data if tables don't exist)
        const data = await getCustomerAccounts()
        setAccounts(data)

        if (!tablesExist) {
          toast({
            title: "Using mock data",
            description: "Database tables not found. Click 'Setup Database' for instructions.",
            variant: "warning",
          })
        }
      } catch (error) {
        console.error("Error loading accounts:", error)
        toast({
          title: "Error loading accounts",
          description: "Failed to load customer accounts. Using mock data instead.",
          variant: "destructive",
        })
        setIsUsingMockData(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [toast])

  // First filter by search term
  const searchFiltered = accounts.filter(
    (account) =>
      account.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.phone && account.phone.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Then filter by status if needed
  const statusFiltered =
    statusFilter === "all" ? searchFiltered : searchFiltered.filter((account) => account.status === statusFilter)

  // Then apply sorting
  const filteredAccounts = React.useMemo(() => {
    if (!sortField) return statusFiltered

    return [...statusFiltered].sort((a, b) => {
      if (sortField === "amount") {
        return sortDirection === "asc" ? a.totalOwed - b.totalOwed : b.totalOwed - a.totalOwed
      } else if (sortField === "status") {
        // Custom sort order for status: overdue -> current -> paid
        const statusOrder = { overdue: 0, current: 1, paid: 2 }
        const aValue = statusOrder[a.status]
        const bValue = statusOrder[b.status]
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      } else if (sortField === "dueDate") {
        // Sort by due date
        const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0) // Use epoch for undefined dates
        const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0)

        // Handle paid accounts (they should go to the end when sorting by due date)
        if (a.status === "paid" && b.status !== "paid") return 1
        if (b.status === "paid" && a.status !== "paid") return -1
        if (a.status === "paid" && b.status === "paid") return 0

        return sortDirection === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
      }
      return 0
    })
  }, [statusFiltered, sortField, sortDirection])

  const getStatusColor = (status: CustomerAccount["status"]) => {
    switch (status) {
      case "current":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewDischarge = async (account: CustomerAccount) => {
    try {
      // First, try to get linked discharge forms from Supabase
      const dischargeForms = await getDischargeFormsForCustomer(account.id)

      if (dischargeForms && dischargeForms.length > 0) {
        // Use the first discharge form found
        setDischargeForm(dischargeForms[0])
      } else {
        // If no discharge forms are linked, try to find one by MRN
        const { data: formData, error } = await supabase
          .from("discharged_patient_forms")
          .select("*")
          .eq("mrn", account.mrn)
          .limit(1)
          .single()

        if (formData) {
          // Convert to our app's DischargedPatient type
          const form: DischargedPatient = {
            id: formData.id,
            name: formData.name,
            address: formData.address || "",
            medicare: formData.medicare || "",
            allergies: formData.allergies || "",
            dob: formData.dob || "",
            mrn: formData.mrn,
            phone: formData.phone || "",
            admissionDate: formData.admission_date || "",
            dischargeDate: formData.discharge_date || "",
            pharmacist: formData.pharmacist || "",
            dateListPrepared: formData.date_list_prepared || "",
            pageInfo: "",
            medications: [], // We'll need to fetch medications separately
            dischargeTimestamp: formData.discharge_timestamp,
          }

          // Fetch medications for this discharge form
          const { data: medicationsData, error: medsError } = await supabase
            .from("discharged_form_medications")
            .select("*")
            .eq("form_id", formData.id)

          if (medicationsData) {
            form.medications = medicationsData.map((med) => ({
              id: med.id,
              name: med.medication_name,
              times: {
                "7am": med.time_7am || "",
                "8am": med.time_8am || "",
                Noon: med.time_noon || "",
                "2pm": med.time_2pm || "",
                "6pm": med.time_6pm || "",
                "8pm": med.time_8pm || "",
                "10pm": med.time_10pm || "",
              },
              status: med.status || "",
              comments: med.comments || "",
            }))
          }

          setDischargeForm(form)
        } else {
          // Create a mock discharge form for demonstration
          toast({
            title: "No discharge form found",
            description: "No discharge form was found for this patient.",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching discharge form:", error)
      toast({
        title: "Error",
        description: "Failed to load discharge form.",
        variant: "destructive",
      })
    }
  }

  const handleRecordPayment = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsPaymentDialogOpen(true)
  }

  const handleViewPaymentHistory = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsHistoryDialogOpen(true)
  }

  const handleViewCallHistory = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsCallHistoryDialogOpen(true)
  }

  const handleAddCall = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsAddCallDialogOpen(true)
  }

  const handleEditDueDate = (account: CustomerAccount) => {
    setSelectedAccountForDueDate(account)
    setIsEditDueDateDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false)
    // Refresh the accounts data
    getCustomerAccounts().then((data) => setAccounts(data))
  }

  const handleCallSuccess = () => {
    setIsAddCallDialogOpen(false)
    // If call history dialog is open, we might want to refresh it
    // For now, just close the add call dialog
  }

  const handleDueDateSuccess = () => {
    setIsEditDueDateDialogOpen(false)
    // Refresh the accounts data
    getCustomerAccounts().then((data) => setAccounts(data))
  }

  const handleInlineDueDateEdit = (account: CustomerAccount) => {
    setEditingDueDateId(account.id)
    setTempDueDate(account.dueDate ? new Date(account.dueDate) : new Date())
  }

  const handleSaveInlineDueDate = async (accountId: string) => {
    if (!tempDueDate) {
      toast({
        title: "Invalid Date",
        description: "Please select a valid due date.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingDueDate(true)
    try {
      const newDueDateISO = format(tempDueDate, "yyyy-MM-dd")
      const result = await updateAccountDueDate(accountId, newDueDateISO)

      if (result.success) {
        // Update local state immediately for better UX
        setAccounts((prevAccounts) =>
          prevAccounts.map((acc) => (acc.id === accountId ? { ...acc, dueDate: newDueDateISO } : acc)),
        )

        // Show visual feedback
        setRecentlyUpdatedId(accountId)
        setTimeout(() => setRecentlyUpdatedId(null), 2000)

        toast({
          title: "Due Date Updated",
          description: `Payment due date updated to ${format(tempDueDate, "PPP")}.`,
        })
      } else {
        toast({
          title: "Error Updating Due Date",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating due date:", error)
      toast({
        title: "Error Updating Due Date",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingDueDate(false)
      setEditingDueDateId(null)
      setTempDueDate(undefined)
    }
  }

  const handleCancelInlineDueDateEdit = () => {
    setEditingDueDateId(null)
    setTempDueDate(undefined)
  }

  const totalOutstanding = filteredAccounts.reduce((sum, account) => sum + account.totalOwed, 0)
  const overdueAccounts = filteredAccounts.filter((account) => account.status === "overdue")
  const currentAccounts = filteredAccounts.filter((account) => account.status === "current")

  const handleSort = (field: "amount" | "status" | "dueDate") => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default direction
      setSortField(field)
      setSortDirection(field === "dueDate" ? "asc" : "desc") // Due dates default to ascending (earliest first)
    }
  }

  const getSortIndicator = (field: "amount" | "status" | "dueDate") => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? " ↑" : " ↓"
  }

  const handleBulkPDFExport = (reportType: "overdue" | "all" | "current") => {
    setBulkReportType(reportType)
    setIsBulkPDFDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Accounting</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading customer accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Accounting</h1>
        {isUsingMockData && (
          <Button onClick={() => setShowSetupGuide(true)} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Setup Database
          </Button>
        )}
      </div>

      {/* Mock Data Warning */}
      {isUsingMockData && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Using Mock Data</AlertTitle>
          <AlertDescription>
            You're currently viewing mock data. To set up the database with real data, click the "Setup Database"
            button.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredAccounts.filter((a) => a.totalOwed > 0).length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              ${overdueAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{currentAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              ${currentAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search by patient name, MRN, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="current">Current Only</SelectItem>
              <SelectItem value="overdue">Overdue Only</SelectItem>
              <SelectItem value="paid">Paid Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>MRN</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => handleSort("amount")}>
                    Amount Owed{getSortIndicator("amount")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => handleSort("status")}>
                    Status{getSortIndicator("status")}
                  </Button>
                </TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 font-medium h-auto" onClick={() => handleSort("dueDate")}>
                    Payment Due{getSortIndicator("dueDate")}
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    No accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.patientName}</TableCell>
                    <TableCell>{account.mrn}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{account.phone || "Not available"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={account.totalOwed > 0 ? "font-semibold" : "text-muted-foreground"}>
                        ${account.totalOwed.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(account.status)}>
                        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {account.lastPaymentDate ? (
                        <div className="text-sm">
                          <div>{new Date(account.lastPaymentDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">${account.lastPaymentAmount?.toFixed(2)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No payments</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.status === "paid" ? (
                        <span className="text-green-600">Paid in full</span>
                      ) : (
                        (() => {
                          const dueDate = account.dueDate ? new Date(account.dueDate) : new Date()
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          dueDate.setHours(0, 0, 0, 0)

                          const isOverdue = dueDate < today
                          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                          const isRecentlyUpdated = recentlyUpdatedId === account.id

                          return (
                            <div className="flex items-center gap-2">
                              {editingDueDateId === account.id ? (
                                // Inline editing interface
                                <div className="flex items-center gap-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                          "justify-start text-left font-normal h-8 px-2",
                                          !tempDueDate && "text-muted-foreground",
                                        )}
                                      >
                                        <CalendarIcon className="mr-1 h-3 w-3" />
                                        {tempDueDate ? format(tempDueDate, "MMM dd") : "Pick date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarUI
                                        mode="single"
                                        selected={tempDueDate}
                                        onSelect={setTempDueDate}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleSaveInlineDueDate(account.id)}
                                    disabled={isUpdatingDueDate}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleCancelInlineDueDateEdit}
                                    disabled={isUpdatingDueDate}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                // Display mode with edit icon
                                <div className="flex items-center gap-1 group">
                                  <div className="text-sm">
                                    <div
                                      className={cn(
                                        "transition-all duration-300",
                                        isOverdue
                                          ? "text-red-600 font-medium"
                                          : daysDiff <= 7
                                            ? "text-orange-600"
                                            : "text-blue-600",
                                        isRecentlyUpdated && "bg-green-100 px-1 rounded animate-pulse",
                                      )}
                                    >
                                      {dueDate.toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {isOverdue
                                        ? `${Math.abs(daysDiff)} days overdue`
                                        : daysDiff <= 0
                                          ? "Due today"
                                          : `Due in ${daysDiff} days`}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-blue-600"
                                    onClick={() => handleInlineDueDateEdit(account)}
                                    title="Edit due date"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleViewDischarge(account)}>
                          <FileText className="h-4 w-4 mr-1" />
                          View Discharge
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecordPayment(account)}
                          disabled={account.totalOwed === 0}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Record Payment
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewPaymentHistory(account)}>
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddCall(account)}>
                          <PhoneCall className="h-4 w-4 mr-1" />
                          Add Call
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account)
                            setIsPDFExportDialogOpen(true)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Export PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Overdue Accounts Report */}
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <Users className="h-4 w-4" />
                  Overdue Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-red-600">{overdueAccounts.length}</div>
                <p className="text-sm text-muted-foreground">
                  Total overdue: ${overdueAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                </p>

                {overdueAccounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-2 pt-2 justify-center">
                      <Button size="sm" variant="outline" onClick={() => setShowOverdueReport(true)} className="flex-1">
                        <Phone className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" onClick={() => handleBulkPDFExport("overdue")} className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Accounts Summary */}
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <CreditCard className="h-4 w-4" />
                  Current Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-blue-600">{currentAccounts.length}</div>
                <p className="text-sm text-muted-foreground">
                  Total current: ${currentAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                </p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleBulkPDFExport("current")}>
                  <Download className="h-3 w-3 mr-1" />
                  Export Current Accounts PDF
                </Button>
              </CardContent>
            </Card>

            {/* All Accounts Summary */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  All Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-gray-600">{filteredAccounts.length}</div>
                <p className="text-sm text-muted-foreground">Total outstanding: ${totalOutstanding.toFixed(2)}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleBulkPDFExport("all")}>
                  <Download className="h-3 w-3 mr-1" />
                  Export All Accounts PDF
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Export Section */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <Download className="h-4 w-4" />
                  Enhanced Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-green-600">{filteredAccounts.length}</div>
                <p className="text-sm text-muted-foreground">Advanced export with selection options</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEnhancedExportDialogOpen(true)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Enhanced Export
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* All existing dialogs remain the same... */}

      {/* Discharge Form Dialog */}
      <Dialog open={!!dischargeForm} onOpenChange={() => setDischargeForm(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {dischargeForm && (
            <>
              <DialogHeader>
                <DialogTitle>Discharge Summary - {dischargeForm.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>DOB:</strong> {dischargeForm.dob ? new Date(dischargeForm.dob).toLocaleDateString() : "N/A"}
                  </div>
                  <div>
                    <strong>MRN:</strong> {dischargeForm.mrn}
                  </div>
                  <div>
                    <strong>Phone:</strong> {dischargeForm.phone || "Not provided"}
                  </div>
                  <div>
                    <strong>Allergies:</strong> {dischargeForm.allergies || "N/A"}
                  </div>
                  <div>
                    <strong>Discharge Date:</strong>{" "}
                    {dischargeForm.dischargeDate ? new Date(dischargeForm.dischargeDate).toLocaleDateString() : "N/A"}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medications:</h4>
                  {dischargeForm.medications.length === 0 ? (
                    <p className="text-muted-foreground">No medications listed.</p>
                  ) : (
                    dischargeForm.medications.map((med, index) => (
                      <div key={med.id || index} className="mb-3 p-3 border rounded-md text-sm">
                        <p>
                          <strong>{med.name || "Unnamed Medication"}</strong>
                        </p>
                        <p>
                          Status: <Badge variant="outline">{med.status || "N/A"}</Badge>
                        </p>
                        <p>Comments: {med.comments || "None"}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-2">
                          {Object.entries(med.times).map(
                            ([time, dose]) =>
                              dose && (
                                <p key={time} className="text-xs">
                                  <strong>{time.toUpperCase()}:</strong> {dose}
                                </p>
                              ),
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t text-xs text-muted-foreground">
                  <p>Pharmacist: {dischargeForm.pharmacist || "N/A"}</p>
                  <p>Prepared: {new Date(dischargeForm.dischargeTimestamp).toLocaleString()}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          {selectedAccount && (
            <RecordPaymentForm
              account={selectedAccount}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent>{selectedAccount && <PaymentHistory account={selectedAccount} />}</DialogContent>
      </Dialog>

      {/* Call History Dialog */}
      <Dialog open={isCallHistoryDialogOpen} onOpenChange={setIsCallHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedAccount && <CallHistory account={selectedAccount} />}
        </DialogContent>
      </Dialog>

      {/* Add Call Dialog */}
      <Dialog open={isAddCallDialogOpen} onOpenChange={setIsAddCallDialogOpen}>
        <DialogContent>
          {selectedAccount && (
            <AddCallLogForm
              account={selectedAccount}
              onSuccess={handleCallSuccess}
              onCancel={() => setIsAddCallDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Overdue Report Dialog */}
      <Dialog open={showOverdueReport} onOpenChange={setShowOverdueReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Overdue Accounts Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h3 className="font-semibold text-red-800">Summary</h3>
                <p className="text-sm text-red-600">
                  {overdueAccounts.length} accounts • Total: $
                  {overdueAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                </p>
              </div>
              <Button onClick={() => handleBulkPDFExport("overdue")} className="bg-red-600 hover:bg-red-700">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <div className="space-y-3">
              {overdueAccounts.map((account) => {
                const dueDate = account.dueDate ? new Date(account.dueDate) : new Date() // Fallback if dueDate is not set
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                dueDate.setHours(0, 0, 0, 0)
                const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <Card key={account.id} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-red-800">{account.patientName}</h4>
                          <p className="text-sm text-muted-foreground">MRN: {account.mrn}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {account.phone || "No phone available"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Amount Owed</p>
                          <p className="text-lg font-bold text-red-600">${account.totalOwed.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Days Overdue</p>
                          <p className="text-lg font-bold text-red-600">{daysOverdue}</p>
                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowOverdueReport(false)
                                handleRecordPayment(account)
                              }}
                            >
                              Record Payment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowOverdueReport(false)
                                handleAddCall(account)
                              }}
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {overdueAccounts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No overdue accounts found.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Setup Guide Dialog */}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Database Setup Guide</DialogTitle>
          </DialogHeader>
          <SetupGuide onClose={() => setShowSetupGuide(false)} />
        </DialogContent>
      </Dialog>

      {/* Single Account PDF Export Dialog */}
      <Dialog open={isPDFExportDialogOpen} onOpenChange={setIsPDFExportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PDFExportDialog
            accounts={filteredAccounts}
            selectedAccount={selectedAccount}
            onClose={() => setIsPDFExportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk PDF Export Dialog */}
      <Dialog open={isBulkPDFDialogOpen} onOpenChange={setIsBulkPDFDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <BulkPDFExportDialog
            accounts={filteredAccounts.filter((account) => {
              if (bulkReportType === "overdue") return account.status === "overdue"
              if (bulkReportType === "current") return account.status === "current"
              return true // all accounts
            })}
            reportType={bulkReportType}
            onClose={() => setIsBulkPDFDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Enhanced Export Dialog */}
      <Dialog open={isEnhancedExportDialogOpen} onOpenChange={setIsEnhancedExportDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <EnhancedExportDialog accounts={filteredAccounts} onClose={() => setIsEnhancedExportDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Due Date Dialog */}
      <Dialog open={isEditDueDateDialogOpen} onOpenChange={setIsEditDueDateDialogOpen}>
        <DialogContent>
          {selectedAccountForDueDate && (
            <EditDueDateDialog
              account={selectedAccountForDueDate}
              onSuccess={handleDueDateSuccess}
              onCancel={() => setIsEditDueDateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
