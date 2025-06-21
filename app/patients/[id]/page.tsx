"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  getPatientById,
  getCustomerAccountByPatientId,
  getDischargeFormsByPatientId,
  getPaymentHistory,
  getCallHistory,
  getPatientDocuments,
} from "@/services/accounting-service"
import type {
  PatientProfile,
  CustomerAccount,
  DischargedPatient,
  Payment,
  CallLog,
  Medication,
  PatientDocument,
} from "@/lib/types"
import {
  User,
  CalendarDays,
  MapPin,
  FileIcon as FileMedical,
  Pill,
  History,
  PhoneCall,
  Phone,
  Users,
  DollarSign,
  Stethoscope,
  Plus,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import DocumentUploadTab from "@/components/document-upload-tab"
import { AddMedicationDialog } from "@/components/add-medication-dialog"
import { MedicationTable } from "@/components/medication-table"
import { v4 as uuidv4 } from "uuid" // For generating unique IDs for new medications
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog" // Import Dialog components
import { PDFGenerator, generatePDFFilename } from "@/lib/pdf-generator" // Import PDFGenerator

// --- Tab Components ---

function PatientDetailsTab({ patient }: { patient: PatientProfile }) {
  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>Name:</strong> {patient.name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FileMedical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>MRN:</strong> {patient.mrn}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>Phone:</strong> {patient.phone || "Not provided"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>Address:</strong> {patient.address}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FileMedical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>Medicare:</strong> {patient.medicare}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm break-words">
            <strong>Allergies:</strong> {patient.allergies}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function MedicationProfileTab({
  patient,
  currentMedications,
  patientNotes, // NEW: Receive patientNotes
}: { patient: PatientProfile; currentMedications: Medication[]; patientNotes: string }) {
  const [comments, setComments] = useState("")
  const { toast } = useToast()
  const [medicationTab, setMedicationTab] = useState("all-medications") // New state for inner tabs
  const [currentMedicationsState, setCurrentMedicationsState] = useState<Medication[]>(currentMedications) // Use a state for current medications
  const [isPillBalanceDialogOpen, setIsPillBalanceDialogOpen] = useState(false) // State for pill balance dialog

  useEffect(() => {
    setCurrentMedicationsState(currentMedications)
  }, [currentMedications])

  const handleSaveComments = async () => {
    console.log("Saving comments:", comments)
    toast({
      title: "Comments Saved",
      description: "Doctor's comments have been saved.",
    })
  }

  const handleAddMedication = (newMedication: Omit<Medication, "id">) => {
    const medicationWithId: Medication = { ...newMedication, id: uuidv4() }
    setCurrentMedicationsState((prev) => [...prev, medicationWithId])
    toast({
      title: "Medication Added",
      description: `${newMedication.name} has been successfully added.`,
    })
  }

  const packedDrugs = currentMedicationsState.filter((med) => med.isPacked)
  const nonPackedDrugs = currentMedicationsState.filter((med) => !med.isPacked)

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Medication Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Section: Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm break-words">
              <strong>Patient Group:</strong> {patient.patientGroup || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm break-words">
              <strong>Patient Status:</strong> {patient.status || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm break-words">
              <strong>PPA Funding:</strong> {patient.ppaFundingInfo || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm break-words">
              <strong>Phone:</strong> {patient.phone || "Not provided"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm break-words">
              <strong>Doctor:</strong> {patient.doctorsName || "N/A"}
            </span>
          </div>
        </div>

        {/* NEW: Inner Tabbed Navigation for Medications */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Tabs value={medicationTab} onValueChange={setMedicationTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-2 w-full md:w-auto h-auto">
              <TabsTrigger
                value="all-medications"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-l-md rounded-r-none"
              >
                All Medications
              </TabsTrigger>
              <TabsTrigger
                value="solid-weekly"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-l-none rounded-r-md flex items-center gap-1"
              >
                Solid Weekly <Plus className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2 md:ml-auto">
            {/* View Pill Balance Button and Dialog */}
            <Dialog open={isPillBalanceDialogOpen} onOpenChange={setIsPillBalanceDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  // Removed onClick={() => console.log("View Pill Balance clicked")}
                >
                  View Pill Balance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Current Pill Balance</DialogTitle>
                  <DialogDescription>
                    <div>
                      Here is the current inventory of medications for {patient.name}:
                      <ul className="list-disc list-inside mt-4 space-y-2">
                        <li>
                          <strong>Amlodipine (5mg):</strong> 45 pills remaining
                        </li>
                        <li>
                          <strong>Metformin (500mg):</strong> 120 pills remaining
                        </li>
                        <li>
                          <strong>Lisinopril (10mg):</strong> 15 pills remaining (Low Stock!)
                        </li>
                        <li>
                          <strong>Simvastatin (20mg):</strong> 60 pills remaining
                        </li>
                      </ul>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => setIsPillBalanceDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Print Report Button and Dialog */}
            <PrintReportDialog
              patient={patient}
              account={patient.customerAccount || null} // Assuming patient.customerAccount exists or is null
              currentMedications={currentMedicationsState}
              dischargeSummaries={patient.dischargeForms || []} // Assuming patient.dischargeForms exists or is empty array
              paymentHistory={patient.paymentHistory || []} // Assuming patient.paymentHistory exists or is empty array
              callHistory={patient.callHistory || []} // Assuming patient.callHistory exists or is empty array
              patientDocuments={patient.documents || []} // Assuming patient.documents exists or is empty array
              notes={patientNotes} // Using the patientNotes state for notes
            />

            {/* NEW: Print Signing Sheet Button and Dialog */}
            <PrintSigningSheetDialog patient={patient} patientNotes={patientNotes} />
          </div>
        </div>

        {/* NEW: Tabs Content for Medications */}
        <TabsContent value="all-medications" className="mt-0"></TabsContent>

        <TabsContent value="solid-weekly" className="mt-0">
          <p className="text-muted-foreground">Content for Solid Weekly medications will go here.</p>
        </TabsContent>

        {/* Moved "Add New Drug" button here */}
        <div className="flex justify-end mb-4">
          {" "}
          {/* Added a div for alignment and spacing */}
          <AddMedicationDialog onAddMedication={handleAddMedication} />
        </div>

        {/* Section: Packed Medications (moved from inner tab) */}
        <div>
          <h3 className="font-semibold text-lg mb-2 border-l-4 border-purple-600 pl-4">Packed Medications:</h3>
          <MedicationTable medications={packedDrugs} />
          {/* Removed AddMedicationDialog from here */}
        </div>

        {/* Section: Non-Packed Medications (moved from inner tab) */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2 border-l-4 border-purple-600 pl-4">Non-Packed Medications:</h3>
          <MedicationTable medications={nonPackedDrugs} />
        </div>
      </CardContent>
    </Card>
  )
}

// NEW: Print Report Dialog Component
interface PrintReportDialogProps {
  patient: PatientProfile
  account: CustomerAccount | null
  currentMedications: Medication[]
  dischargeSummaries: DischargedPatient[]
  paymentHistory: Payment[]
  callHistory: CallLog[]
  patientDocuments: PatientDocument[]
  notes: string
}

function PrintReportDialog({
  patient,
  account,
  currentMedications,
  dischargeSummaries,
  paymentHistory,
  callHistory,
  patientDocuments,
  notes,
}: PrintReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleGenerateReport = () => {
    try {
      const pdfGenerator = new PDFGenerator()
      pdfGenerator.generatePatientReportPDF(
        patient,
        account,
        currentMedications,
        dischargeSummaries,
        paymentHistory,
        callHistory,
        patientDocuments,
        notes,
      )
      const filename = generatePDFFilename("patient-report", patient.name)
      pdfGenerator.save(filename)
      toast({
        title: "Report Generated",
        description: `Patient report for ${patient.name} has been generated and downloaded.`,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error generating patient report:", error)
      toast({
        title: "Error",
        description: "Failed to generate patient report. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Print Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Patient Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF report for {patient.name}. This report will include patient details, medication
            information, history, accounting summary, and notes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Click "Generate and Download" to create the PDF report. You can then open and print it from your device.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateReport}>Generate and Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// NEW: Print Signing Sheet Dialog Component
interface PrintSigningSheetDialogProps {
  patient: PatientProfile
  patientNotes: string
}

function PrintSigningSheetDialog({ patient, patientNotes }: PrintSigningSheetDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleGenerateSigningSheet = () => {
    try {
      const pdfGenerator = new PDFGenerator()
      pdfGenerator.generateSigningSheetPDF(patient, patientNotes)
      const filename = generatePDFFilename("signing-sheet", patient.name)
      pdfGenerator.save(filename)
      toast({
        title: "Signing Sheet Generated",
        description: `Patient signing sheet for ${patient.name} has been generated and downloaded.`,
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Error generating signing sheet:", error)
      toast({
        title: "Error",
        description: "Failed to generate signing sheet. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Print Signing Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Patient Signing Sheet</DialogTitle>
          <DialogDescription>
            Generate a PDF signing sheet for {patient.name}. This sheet will include patient details and fields for
            signature and date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Click "Generate and Download" to create the PDF signing sheet. You can then open and print it from your
            device.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateSigningSheet}>Generate and Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MedicationHistoryTab({ dischargeSummaries }: { dischargeSummaries: DischargedPatient[] }) {
  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Medication History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dischargeSummaries.length === 0 ? (
          <p className="text-muted-foreground">No previous medication records found.</p>
        ) : (
          dischargeSummaries.map((form) => (
            <div key={form.id} className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-semibold text-lg mb-2 break-words">
                Medications from {new Date(form.dischargeTimestamp).toLocaleDateString()}
              </h3>
              {form.medications.length === 0 ? (
                <p className="text-xs text-muted-foreground">No medications listed in this summary.</p>
              ) : (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {form.medications.map((med: Medication, idx: number) => (
                    <li key={idx} className="break-words">
                      <strong>{med.name}</strong>: {med.dosageFrequency || med.status || "N/A"}
                      {med.comments && <span className="text-muted-foreground ml-2">({med.comments})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function AdmissionsTab({ dischargeSummaries }: { dischargeSummaries: DischargedPatient[] }) {
  const admissions = dischargeSummaries
    .filter((form) => form.admissionDate)
    .sort((a, b) => new Date(b.admissionDate!).getTime() - new Date(a.admissionDate!).getTime())

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Admissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {admissions.length === 0 ? (
          <p className="text-muted-foreground">No admission records found for this patient.</p>
        ) : (
          admissions.map((form) => (
            <div key={form.id} className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-semibold text-lg mb-2 break-words">
                Admission on {new Date(form.admissionDate!).toLocaleDateString()}
              </h3>
              {form.dischargeDate && (
                <p className="text-sm text-muted-foreground break-words">
                  Discharged on: {new Date(form.dischargeDate).toLocaleDateString()}
                </p>
              )}
              {form.hospitalName && (
                <p className="text-sm text-muted-foreground break-words">Hospital: {form.hospitalName}</p>
              )}
              <p className="text-sm text-muted-foreground break-words">
                Reason for Admission: {form.reasonForAdmission || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground break-words">Pharmacist: {form.pharmacist || "N/A"}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function NotesTab({
  patientId,
  notes,
  setNotes,
}: { patientId: string; notes: string; setNotes: (notes: string) => void }) {
  const { toast } = useToast()

  useEffect(() => {
    const fetchedNotes = localStorage.getItem(`patient-notes-${patientId}`) || ""
    setNotes(fetchedNotes)
  }, [patientId, setNotes])

  const handleSaveNotes = async () => {
    localStorage.setItem(`patient-notes-${patientId}`, notes)
    toast({
      title: "Notes Saved",
      description: "Doctor's and contact notes have been saved.",
    })
  }

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Doctors and Contacts Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add general notes about the patient, doctors, or contacts..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          className="mb-4"
        />
        <Button onClick={handleSaveNotes}>Save Notes</Button>
      </CardContent>
    </Card>
  )
}

function AccountingTab({
  account,
  paymentHistory,
  callHistory,
}: { account: CustomerAccount | null; paymentHistory: Payment[]; callHistory: CallLog[] }) {
  const getStatusColor = (status: CustomerAccount["status"]) => {
    switch (status) {
      case "current":
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="border-l-4 border-purple-600 pl-4">Accounting Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {account ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-medium text-gray-700">Total Amount Owed:</p>
                <p className="text-3xl font-bold text-gray-900 break-words">${account.totalOwed.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">Payment Status:</p>
                <Badge className={`text-2xl px-4 py-2 ${getStatusColor(account.status)} break-words`}>
                  {getStatusText(account.status)}
                </Badge>
                {account.status === "overdue" && (
                  <p className="text-sm text-red-600 mt-2 break-words">
                    Please contact the patient regarding their outstanding balance.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2 border-l-4 border-purple-600 pl-4">
                <History className="h-5 w-5 flex-shrink-0" /> Payment History
              </h3>
              {paymentHistory.length === 0 ? (
                <p className="text-muted-foreground">No payment records found.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap justify-between items-center text-sm break-words">
                      <span>
                        {new Date(payment.paymentDate).toLocaleDateString()} - {payment.method}
                      </span>
                      <span className="font-medium">${payment.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-xl mb-3 flex items-center gap-2 border-l-4 border-purple-600 pl-4">
                <PhoneCall className="h-5 w-5 flex-shrink-0" /> Call History
              </h3>
              {callHistory.length === 0 ? (
                <p className="text-muted-foreground">No call records found.</p>
              ) : (
                <ul className="space-y-2">
                  {callHistory.map((call) => (
                    <li key={call.id} className="text-sm break-words">
                      <strong>{new Date(call.callDate).toLocaleDateString()}</strong>: {call.comments}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No accounting information found for this patient.</p>
        )}
      </CardContent>
    </Card>
  )
}

// --- Main Patient Management Page ---
export default function PatientManagementPage() {
  const params = useParams()
  const patientId = params.id as string
  const { toast } = useToast()

  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [account, setAccount] = useState<CustomerAccount | null>(null)
  const [dischargeSummaries, setDischargeSummaries] = useState<DischargedPatient[]>([])
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [callHistory, setCallHistory] = useState<CallLog[]>([])
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("medication-profile") // Default to medication profile
  const [patientNotes, setPatientNotes] = useState<string>("") // NEW: State for patient notes

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedPatientData: PatientProfile | null = await getPatientById(patientId)
      if (fetchedPatientData) {
        // Add dummy data for new fields if not present
        fetchedPatientData.status = fetchedPatientData.status || (Math.random() > 0.5 ? "Active" : "Inactive")
        fetchedPatientData.patientGroup = fetchedPatientData.patientGroup || "Group A"
        fetchedPatientData.ppaFundingInfo = fetchedPatientData.ppaFundingInfo || "Funded by PPA"
        fetchedPatientData.doctorsName = fetchedPatientData.doctorsName || "Dr. Jane Doe"
      }

      const [fetchedAccount, fetchedDischargeSummaries, fetchedPatientDocuments] = await Promise.all([
        getCustomerAccountByPatientId(patientId),
        getDischargeFormsByPatientId(patientId),
        getPatientDocuments(patientId),
      ])

      setPatient(fetchedPatientData)
      setAccount(fetchedAccount)
      setDischargeSummaries(fetchedDischargeSummaries)
      setPatientDocuments(fetchedPatientDocuments)

      if (fetchedAccount) {
        const [fetchedPaymentHistory, fetchedCallHistory] = await Promise.all([
          getPaymentHistory(fetchedAccount.id),
          getCallHistory(fetchedAccount.id),
        ])
        setPaymentHistory(fetchedPaymentHistory)
        setCallHistory(fetchedCallHistory)
      } else {
        setPaymentHistory([])
        setCallHistory([])
      }
    } catch (error) {
      console.error("Error fetching patient data:", error)
      toast({
        title: "Error",
        description: "Failed to load patient data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => {
    if (patientId) {
      fetchData()
    }
  }, [patientId, fetchData])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <div className="flex flex-wrap gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-xl font-semibold">Patient not found.</p>
      </div>
    )
  }

  // Ensure patient object has all necessary data for the report, even if dummy
  const patientWithAllData: PatientProfile = {
    ...patient,
    customerAccount: account || undefined,
    dischargeForms: dischargeSummaries,
    paymentHistory: paymentHistory,
    callHistory: callHistory,
    documents: patientDocuments,
  }

  const currentMedications =
    dischargeSummaries.length > 0
      ? dischargeSummaries[0].medications.map((med, index) => ({
          ...med,
          id: med.id || uuidv4(), // Ensure ID exists
          isPacked: index % 2 === 0, // Example: alternate packed/non-packed
          directions: med.directions || (index % 3 === 0 ? "Take with food" : "Take before bed"),
          pack: med.pack || (index % 2 === 0 ? "Weekly" : "Daily"),
          startDate: med.startDate || "2023-01-01",
          endDate: med.endDate || "2024-12-31",
          frequency: med.frequency || (index % 4 === 0 ? "Once Daily" : "Twice Daily"),
          category: med.category || (index % 5 === 0 ? "Antibiotic" : "Pain Reliever"),
          note: med.note || (index % 6 === 0 ? "Monitor blood pressure" : "No specific notes"),
        }))
      : []

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 break-words inline-block border-b-2 border-purple-600">
        Patient Management: {patient.name}{" "}
        <Badge
          className={`ml-2 text-base ${
            patient.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {patient.status}
        </Badge>
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto flex-wrap">
          <TabsTrigger value="medication-profile" className="text-xs sm:text-sm">
            Medication Profile
          </TabsTrigger>
          <TabsTrigger value="medication-history" className="text-xs sm:text-sm">
            Medication History
          </TabsTrigger>
          <TabsTrigger value="admissions" className="text-xs sm:text-sm">
            Admissions
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">
            Patient Details
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            Doctors & Contacts Notes
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">
            Uploading Documents
          </TabsTrigger>
          <TabsTrigger value="accounting" className="text-xs sm:text-sm">
            Accounting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medication-profile" className="mt-6">
          <MedicationProfileTab
            patient={patientWithAllData}
            currentMedications={currentMedications}
            patientNotes={patientNotes}
          />
        </TabsContent>

        <TabsContent value="medication-history" className="mt-6">
          <MedicationHistoryTab dischargeSummaries={dischargeSummaries} />
        </TabsContent>

        <TabsContent value="admissions" className="mt-6">
          <AdmissionsTab dischargeSummaries={dischargeSummaries} />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <PatientDetailsTab patient={patient} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab patientId={patientId} notes={patientNotes} setNotes={setPatientNotes} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentUploadTab
            patientId={patientId}
            existingDocuments={patientDocuments}
            onDocumentUploadSuccess={fetchData}
          />
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <AccountingTab account={account} paymentHistory={paymentHistory} callHistory={callHistory} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
