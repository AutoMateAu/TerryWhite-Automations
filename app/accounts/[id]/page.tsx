"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { FileText, DollarSign, History, PhoneCall, Edit, Download, Check, X, CalendarIcon } from "lucide-react"
import type { CustomerAccount, DischargedPatient } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { RecordPaymentForm } from "@/components/record-payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { CallHistory } from "@/components/call-history"
import { AddCallLogForm } from "@/components/add-call-log-form"
import {
  getCustomerAccountById,
  getDischargeFormsForCustomer,
  updateAccountDueDate,
} from "@/services/accounting-service"
import { createClient } from "@/utils/supabase/client"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { EditDueDateDialog } from "@/components/edit-due-date-dialog"
import { format } from "date-fns"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface AccountDetailPageProps {
  params: {
    id: string
  }
}

export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  const accountId = params.id
  const [account, setAccount] = useState<CustomerAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [dischargeForm, setDischargeForm] = useState<DischargedPatient | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [isAddCallDialogOpen, setIsAddCallDialogOpen] = useState(false)
  const [isPDFExportDialogOpen, setIsPDFExportDialogOpen] = useState(false)
  const [isEditDueDateDialogOpen, setIsEditDueDateDialogOpen] = useState(false)

  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined)
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false)
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function loadAccount() {
      setLoading(true)
      try {
        const fetchedAccount = await getCustomerAccountById(accountId)
        if (fetchedAccount) {
          setAccount(fetchedAccount)
        } else {
          toast({
            title: "Account Not Found",
            description: "The requested customer account could not be found.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading account:", error)
        toast({
          title: "Error",
          description: "Failed to load customer account details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadAccount()
  }, [accountId, toast])

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

  const handleViewDischarge = async () => {
    if (!account) return
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

  const handleRecordPayment = () => {
    if (account) setIsPaymentDialogOpen(true)
  }

  const handleViewPaymentHistory = () => {
    if (account) setIsHistoryDialogOpen(true)
  }

  const handleViewCallHistory = () => {
    if (account) setIsCallHistoryDialogOpen(true)
  }

  const handleAddCall = () => {
    if (account) setIsAddCallDialogOpen(true)
  }

  const handleEditDueDate = () => {
    if (account) setIsEditDueDateDialogOpen(true)
  }

  const handlePaymentSuccess = async () => {
    setIsPaymentDialogOpen(false)
    const updatedAccount = await getCustomerAccountById(accountId)
    if (updatedAccount) setAccount(updatedAccount)
  }

  const handleCallSuccess = async () => {
    setIsAddCallDialogOpen(false)
    const updatedAccount = await getCustomerAccountById(accountId)
    if (updatedAccount) setAccount(updatedAccount)
  }

  const handleDueDateSuccess = async () => {
    setIsEditDueDateDialogOpen(false)
    const updatedAccount = await getCustomerAccountById(accountId)
    if (updatedAccount) setAccount(updatedAccount)
  }

  const handleInlineDueDateEdit = () => {
    if (account) {
      setEditingDueDateId(account.id)
      setTempDueDate(account.dueDate ? new Date(account.dueDate) : new Date())
    }
  }

  const handleSaveInlineDueDate = async () => {
    if (!account || !tempDueDate) {
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
      const result = await updateAccountDueDate(account.id, newDueDateISO)

      if (result.success) {
        setAccount((prev) => (prev ? { ...prev, dueDate: newDueDateISO } : null))
        setRecentlyUpdatedId(account.id)
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Account Details</h1>
        <Card className="rounded-2xl shadow-md p-6">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-8">Account Details</h1>
        <Alert variant="destructive">
          <AlertTitle>Account Not Found</AlertTitle>
          <AlertDescription>The customer account with ID "{accountId}" could not be loaded.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const dueDate = account.dueDate ? new Date(account.dueDate) : new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const isOverdue = dueDate < today
  const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isRecentlyUpdated = recentlyUpdatedId === account.id

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Account Details: {account.patientName}</h1>

      <Card className="rounded-3xl shadow-xl overflow-hidden border border-gray-200 mb-8">
        <CardHeader className="bg-white px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            {account.patientName} ({account.mrn})
          </CardTitle>
          <p className="text-sm text-gray-500">{account.phone || "No phone available"}</p>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-lg font-medium text-gray-700">Amount Owed:</p>
            <p className="text-4xl font-bold text-gray-900">${account.totalOwed.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">Status:</p>
            <Badge className={cn("text-lg px-3 py-1", getStatusColor(account.status))}>
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">Last Payment:</p>
            {account.lastPaymentDate ? (
              <div className="text-xl font-semibold text-gray-900">
                {new Date(account.lastPaymentDate).toLocaleDateString()} (${account.lastPaymentAmount?.toFixed(2)})
              </div>
            ) : (
              <span className="text-xl text-muted-foreground">No payments recorded</span>
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">Payment Due:</p>
            {account.status === "paid" ? (
              <span className="text-xl font-semibold text-green-600">Paid in full</span>
            ) : (
              (() => {
                return (
                  <div className="flex items-center gap-2">
                    {editingDueDateId === account.id ? (
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
                              {tempDueDate ? format(tempDueDate, "MMM dd, yyyy") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI mode="single" selected={tempDueDate} onSelect={setTempDueDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={handleSaveInlineDueDate}
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
                      <div className="flex items-center gap-1 group">
                        <div className="text-xl font-semibold">
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
                          <div className="text-sm text-muted-foreground">
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
                          onClick={handleInlineDueDateEdit}
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
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-xl overflow-hidden border border-gray-200">
        <CardHeader className="bg-white px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleViewDischarge}>
            <FileText className="h-4 w-4 mr-2" />
            View Discharge
          </Button>
          <Button onClick={handleRecordPayment} disabled={account.totalOwed === 0}>
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={handleViewPaymentHistory}>
            <History className="h-4 w-4 mr-2" />
            Payment History
          </Button>
          <Button variant="outline" onClick={handleViewCallHistory}>
            <PhoneCall className="h-4 w-4 mr-2" />
            Call History
          </Button>
          <Button onClick={handleAddCall}>
            <PhoneCall className="h-4 w-4 mr-2" />
            Add Call Log
          </Button>
          <Button variant="outline" onClick={handleEditDueDate}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Due Date
          </Button>
          <Button variant="outline" onClick={() => setIsPDFExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </CardContent>
      </Card>

      {/* All Dialogs (moved from accounting/page.tsx) */}
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

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          {account && (
            <RecordPaymentForm
              account={account}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent>{account && <PaymentHistory account={account} />}</DialogContent>
      </Dialog>

      <Dialog open={isCallHistoryDialogOpen} onOpenChange={setIsCallHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">{account && <CallHistory account={account} />}</DialogContent>
      </Dialog>

      <Dialog open={isAddCallDialogOpen} onOpenChange={setIsAddCallDialogOpen}>
        <DialogContent>
          {account && (
            <AddCallLogForm
              account={account}
              onSuccess={handleCallSuccess}
              onCancel={() => setIsAddCallDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPDFExportDialogOpen} onOpenChange={setIsPDFExportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {account && (
            <PDFExportDialog
              accounts={[account]} // Pass the single account in an array
              selectedAccount={account}
              onClose={() => setIsPDFExportDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDueDateDialogOpen} onOpenChange={setIsEditDueDateDialogOpen}>
        <DialogContent>
          {account && (
            <EditDueDateDialog
              account={account}
              onSuccess={handleDueDateSuccess}
              onCancel={() => setIsEditDueDateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
