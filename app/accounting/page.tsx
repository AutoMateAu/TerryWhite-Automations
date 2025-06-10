"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Database, AlertTriangle, PhoneCall } from "lucide-react"
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
import { Download, Phone, Users } from "lucide-react"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog"
import { EnhancedExportDialog } from "@/components/enhanced-export-dialog"
import { EditDueDateDialog } from "@/components/edit-due-date-dialog" // Import the new dialog
import { format } from "date-fns"
import AccountingOverview from "@/components/accounting-overview" // Import the new overview component

export default function AccountingPage() {
  // Keep states for dialogs and their related data
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null)
  const [dischargeForm, setDischargeForm] = useState<DischargedPatient | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [isAddCallDialogOpen, setIsAddCallDialogOpen] = useState(false)
  const [isPDFExportDialogOpen, setIsPDFExportDialogOpen] = useState(false)
  const [isBulkPDFDialogOpen, setIsBulkPDFDialogOpen] = useState(false)
  const [bulkReportType, setBulkReportType] = useState<"overdue" | "all" | "current">("all")
  const [isEnhancedExportDialogOpen, setIsEnhancedExportDialogOpen] = useState(false)
  const [isEditDueDateDialogOpen, setIsEditDueDateDialogOpen] = useState(false)
  const [selectedAccountForDueDate, setSelectedAccountForDueDate] = useState<CustomerAccount | null>(null)

  // Keep states for setup guide and mock data warning
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)

  // Keep states for inline due date editing (if still desired for table rows)
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined)
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false)
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  // --- Data fetching and filtering logic (simplified for dialogs) ---
  // We still need a way to get accounts for dialogs, but the main display is static.
  // For a full integration, you'd connect AccountingOverview to real data.
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]) // Keep for dialogs
  const [isLoading, setIsLoading] = useState(true) // Keep for initial load check

  useEffect(() => {
    async function loadAccountsForDialogs() {
      try {
        const tablesExist = await checkTablesExist()
        setIsUsingMockData(!tablesExist)
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
    loadAccountsForDialogs()
  }, [toast])

  // Filtered accounts for dialogs (e.g., bulk export)
  const filteredAccounts = accounts // For now, use all fetched accounts for dialogs

  const handleViewDischarge = async (account: CustomerAccount) => {
    try {
      const dischargeForms = await getDischargeFormsForCustomer(account.id)
      if (dischargeForms && dischargeForms.length > 0) {
        setDischargeForm(dischargeForms[0])
      } else {
        const { data: formData, error } = await supabase
          .from("discharged_patient_forms")
          .select("*")
          .eq("mrn", account.mrn)
          .limit(1)
          .single()

        if (formData) {
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
            medications: [],
            dischargeTimestamp: formData.discharge_timestamp,
          }

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
    getCustomerAccounts().then((data) => setAccounts(data)) // Refresh accounts for dialogs
  }

  const handleCallSuccess = () => {
    setIsAddCallDialogOpen(false)
  }

  const handleDueDateSuccess = () => {
    setIsEditDueDateDialogOpen(false)
    getCustomerAccounts().then((data) => setAccounts(data)) // Refresh accounts for dialogs
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
        setAccounts((prevAccounts) =>
          prevAccounts.map((acc) => (acc.id === accountId ? { ...acc, dueDate: newDueDateISO } : acc)),
        )
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

  const handleBulkPDFExport = (reportType: "overdue" | "all" | "current") => {
    setBulkReportType(reportType)
    setIsBulkPDFDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Accounting</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading accounting overview...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AccountingOverview /> {/* Render the new overview component */}
      {/* Mock Data Warning (kept as it's relevant to database setup) */}
      {isUsingMockData && (
        <div className="container mx-auto px-6 mt-6">
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Using Mock Data</AlertTitle>
            <AlertDescription>
              You're currently viewing mock data. To set up the database with real data, click the "Setup Database"
              button.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowSetupGuide(true)} variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Setup Database
            </Button>
          </div>
        </div>
      )}
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
      {/* Overdue Report Dialog (kept, but its data will come from `accounts` state) */}
      <Dialog open={false} onOpenChange={() => {}}>
        {" "}
        {/* This dialog was previously `showOverdueReport` */}
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
                  {accounts.filter((a) => a.status === "overdue").length} accounts • Total: $
                  {accounts
                    .filter((a) => a.status === "overdue")
                    .reduce((sum, acc) => sum + acc.totalOwed, 0)
                    .toFixed(2)}
                </p>
              </div>
              <Button onClick={() => handleBulkPDFExport("overdue")} className="bg-red-600 hover:bg-red-700">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <div className="space-y-3">
              {accounts
                .filter((a) => a.status === "overdue")
                .map((account) => {
                  const dueDate = account.dueDate ? new Date(account.dueDate) : new Date()
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
                                  // setShowOverdueReport(false) // Removed as this dialog is now controlled differently
                                  handleRecordPayment(account)
                                }}
                              >
                                Record Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // setShowOverdueReport(false) // Removed as this dialog is now controlled differently
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

            {accounts.filter((a) => a.status === "overdue").length === 0 && (
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
    </>
  )
}
