"use client"

import type React from "react"

import { useState, useEffect } from "react" // Import useEffect
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Send, Printer, FileSpreadsheet, ArrowLeft } from "lucide-react"
import type { PatientFormData, Medication, MedicationWithComment } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation" // Keep useRouter for potential future redirects outside drawer
import { MedicationSearch } from "@/components/medication-search"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { MedicationStatusCombobox } from "@/components/medication-status-combobox"
import { HomeNewStatusCombobox } from "@/components/home-new-status-combobox"
import { ChartedStatusCombobox } from "@/components/charted-status-combobox"
import { exportMedicationsToExcel } from "@/lib/export-excel"
import { submitMedicationPlanToDB } from "@/services/accounting-service" // Import the new server action
import { PDFGenerator, generatePDFFilename } from "@/lib/pdf-generator" // Import PDF generation utilities

// Define props for the MedicationPlanForm
interface MedicationPlanFormProps {
  templateType: "before-admission" | "after-admission" | "new" | "hospital-specific"
  hospitalName?: string
  onBack: () => void // Callback to go back to the main discharge summaries page
  // onCloseDrawer?: () => void // Removed
  initialPatientData?: Partial<PatientFormData> // New prop for pre-filling patient data
}

// Helper function to create an empty medication row based on template type
const createEmptyMedication = (templateType: MedicationPlanFormProps["templateType"]): Medication => {
  if (templateType === "before-admission") {
    return {
      id: Date.now().toString() + Math.random(),
      name: "",
      dosageFrequency: "",
      homeNewStatus: "",
      chartedStatus: "",
      commentsActions: "",
      drSignActionCompleted: "",
    }
  } else {
    return {
      id: Date.now().toString() + Math.random(),
      name: "",
      times: { "7am": "", "8am": "", Noon: "", "2pm": "", "5pm": "", "8pm": "", "10pm": "" }, // Changed 6pm to 5pm
      status: "",
      comments: "",
      category: "", // Ensure category is initialized for grouping
    }
  }
}

const initialFormDataBase: PatientFormData = {
  name: "",
  address: "",
  medicare: "",
  allergies: "",
  dob: "",
  mrn: "",
  phone: "",
  admissionDate: "",
  dischargeDate: "",
  pharmacist: "",
  dateListPrepared: new Date().toISOString().split("T")[0],
  concession: "",
  healthFund: "",
  reasonForAdmission: "",
  relevantPastMedicalHistory: "",
  communityPharmacist: "",
  generalPractitioner: "",
  medicationRisksComments: "",
  sourcesOfHistory: "",
  pharmacistSignature: "",
  dateTimeSigned: "",
  medications: [],
  commentsStoppedMedications: "", // Added for the new PDF section
}

export default function MedicationPlanForm({
  templateType,
  hospitalName,
  onBack,
  // onCloseDrawer, // Removed
  initialPatientData,
}: MedicationPlanFormProps) {
  const [formData, setFormData] = useState<PatientFormData>(() => {
    const baseData = {
      ...initialFormDataBase,
      ...initialPatientData, // Apply initial patient data
      dateListPrepared: new Date().toISOString().split("T")[0],
    }

    // Initialize medications based on template type
    baseData.medications = [createEmptyMedication(templateType)]

    // Pre-fill logic based on templateType
    if (templateType === "after-admission") {
      return { ...baseData, dischargeDate: new Date().toISOString().split("T")[0] }
    }
    return baseData
  })

  // Update form data if initialPatientData changes (e.g., when switching patient type in drawer)
  useEffect(() => {
    setFormData((prev) => ({
      ...initialFormDataBase,
      ...initialPatientData,
      dateListPrepared: new Date().toISOString().split("T")[0],
      medications: prev.medications.length > 0 ? prev.medications : [createEmptyMedication(templateType)], // Keep existing meds if any, otherwise re-init
    }))
  }, [initialPatientData, templateType])

  const { toast } = useToast()
  const router = useRouter() // Keep useRouter for potential future redirects outside drawer

  const getTitle = () => {
    switch (templateType) {
      case "before-admission":
        return "Medication Management Plan (Before Admission)"
      case "after-admission":
        return "Medication Management Plan (After Admission)"
      case "new":
        return "New Medication Management Plan"
      case "hospital-specific":
        return `Medication Plan for ${hospitalName || "Selected Hospital"}`
      default:
        return "Medication Management Plan"
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMedicationChange = (
    index: number,
    field: keyof Medication | `times.${keyof Medication["times"]}`,
    value: string,
  ) => {
    const newMedications = [...formData.medications]
    if (field.startsWith("times.")) {
      const timeKey = field.split(".")[1] as keyof Medication["times"]
      ;(newMedications[index] as any).times[timeKey] = value
    } else {
      ;(newMedications[index] as any)[field] = value
    }
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const handleMedicationSelection = (index: number, medicationWithComment: MedicationWithComment | null) => {
    const newMedications = [...formData.medications]
    if (medicationWithComment) {
      newMedications[index].name = medicationWithComment.name
      if (templateType === "before-admission") {
        ;(newMedications[index] as any).commentsActions = medicationWithComment.comment || ""
      } else {
        ;(newMedications[index] as any).comments = medicationWithComment.comment || ""
        ;(newMedications[index] as any).category = medicationWithComment.category || "" // Set category from search
      }

      if (index === formData.medications.length - 1) {
        newMedications.push(createEmptyMedication(templateType))
      }
    } else {
      newMedications[index].name = ""
      if (templateType === "before-admission") {
        ;(newMedications[index] as any).commentsActions = ""
      } else {
        ;(newMedications[index] as any).comments = ""
        ;(newMedications[index] as any).category = ""
      }
    }
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const addMedicationRow = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, createEmptyMedication(templateType)],
    }))
  }

  const removeMedicationRow = (index: number) => {
    if (formData.medications.length === 1) {
      toast({ title: "Cannot remove last medication row", variant: "destructive" })
      return
    }
    const newMedications = formData.medications.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const isMedicationRowEmpty = (medication: Medication) => {
    if (templateType === "before-admission") {
      const med = medication as Medication
      return (
        !med.name?.trim() &&
        !med.dosageFrequency?.trim() &&
        !med.homeNewStatus?.trim() &&
        !med.chartedStatus?.trim() &&
        !med.commentsActions?.trim() &&
        !med.drSignActionCompleted?.trim()
      )
    } else {
      const med = medication as Medication
      return (
        !med.name?.trim() &&
        !med.status?.trim() &&
        !med.comments?.trim() &&
        Object.values(med.times || {}).every((time) => !time?.trim())
      )
    }
  }

  const handleSaveAndPrint = () => {
    const medicationsWithData = formData.medications.filter((med) => !isMedicationRowEmpty(med))

    if (!formData.name || !formData.mrn || !formData.dob || medicationsWithData.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in patient name, MRN, DOB, and add at least one medication before printing.",
        variant: "destructive",
      })
      return
    }

    const pdfGenerator = new PDFGenerator()

    if (templateType === "after-admission" || templateType === "hospital-specific") {
      pdfGenerator.generateDischargeMedicationSummaryPDF(formData, hospitalName)
      pdfGenerator.save(generatePDFFilename("discharge-summary", formData.name))
    } else {
      pdfGenerator.generateMedicationPlanPDF(formData, templateType)
      pdfGenerator.save(generatePDFFilename("medication-plan", formData.name, templateType))
    }

    toast({
      title: "Medication Plan Generated",
      description: "The medication plan has been downloaded as a PDF.",
    })
  }

  const handleDownloadExcel = () => {
    const medicationsToExport = formData.medications.filter((med) => !isMedicationRowEmpty(med))
    if (medicationsToExport.length === 0) {
      toast({
        title: "No Medications to Export",
        description: "Please add at least one medication to export to Excel.",
        variant: "destructive",
      })
      return
    }
    exportMedicationsToExcel(medicationsToExport, formData.name || "Patient", templateType)
    toast({
      title: "Medications Exported",
      description: "The medication list has been downloaded as an Excel file.",
    })
  }

  const handleSubmitToDischarge = async () => {
    const medicationsWithData = formData.medications.filter((med) => !isMedicationRowEmpty(med))

    if (!formData.name || !formData.mrn || !formData.dob || medicationsWithData.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in patient name, MRN, DOB, and add at least one medication.",
        variant: "destructive",
      })
      return
    }

    const dataToSubmit = {
      ...formData,
      medications: medicationsWithData,
    }

    const result = await submitMedicationPlanToDB(dataToSubmit, templateType, hospitalName)

    if (result.success) {
      toast({
        title: "Template Sent to Discharge",
        description: `Medication plan for ${formData.name} has been prepared and saved.`,
      })
      // Always redirect to the main discharge page after submission, with hospitalId
      router.push(`/discharge?hospitalId=${result.hospitalId || "all"}`)
    } else {
      toast({
        title: "Submission Failed",
        description: result.error || "An error occurred while saving the medication plan.",
        variant: "destructive",
      })
    }
  }

  const timeSlots: (keyof Medication["times"])[] = ["7am", "8am", "Noon", "2pm", "5pm", "8pm", "10pm"] // Changed 6pm to 5pm

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50 animate-gradient-shift bg-[length:200%_200%]">
      <Card className="max-w-6xl mx-auto rounded-3xl shadow-2xl backdrop-blur-lg bg-white/80 border border-white/30 animate-fade-in-up">
        <CardHeader className="pb-4 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-3xl flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">{getTitle()}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack} // This now goes back to the main discharge summaries page
            className="text-gray-700 hover:bg-gray-100/50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Discharges
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Patient Information Section */}
          <div className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-600 pl-4">
            Patient Information
          </div>
          {templateType === "before-admission" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white/70 shadow-inner border border-white/40">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                  Patient Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dob" className="text-xs font-medium text-gray-700">
                  D.O.B.
                </Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mrn" className="text-xs font-medium text-gray-700">
                  MRN
                </Label>
                <Input
                  id="mrn"
                  name="mrn"
                  value={formData.mrn}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="medicare" className="text-xs font-medium text-gray-700">
                  Medicare
                </Label>
                <Input
                  id="medicare"
                  name="medicare"
                  value={formData.medicare || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1 col-span-full md:col-span-2">
                <Label htmlFor="address" className="text-xs font-medium text-gray-700">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="concession" className="text-xs font-medium text-gray-700">
                  Concession
                </Label>
                <Input
                  id="concession"
                  name="concession"
                  value={formData.concession || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="healthFund" className="text-xs font-medium text-gray-700">
                  Health Fund
                </Label>
                <Input
                  id="healthFund"
                  name="healthFund"
                  value={formData.healthFund || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="allergies" className="text-xs font-medium text-gray-700">
                  Allergies
                </Label>
                <Input
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-white/70 shadow-inner border border-white/40">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dob" className="text-xs font-medium text-gray-700">
                  DOB
                </Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mrn" className="text-xs font-medium text-gray-700">
                  MRN
                </Label>
                <Input
                  id="mrn"
                  name="mrn"
                  value={formData.mrn}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1 col-span-full md:col-span-2">
                <Label htmlFor="address" className="text-xs font-medium text-gray-700">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="medicare" className="text-xs font-medium text-gray-700">
                  Medicare
                </Label>
                <Input
                  id="medicare"
                  name="medicare"
                  value={formData.medicare}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="allergies" className="text-xs font-medium text-gray-700">
                  Allergies
                </Label>
                <Input
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admissionDate" className="text-xs font-medium text-gray-700">
                  Admission Date
                </Label>
                <Input
                  id="admissionDate"
                  name="admissionDate"
                  type="date"
                  value={formData.admissionDate || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dischargeDate" className="text-xs font-medium text-gray-700">
                  Discharge Date
                </Label>
                <Input
                  id="dischargeDate"
                  name="dischargeDate"
                  type="date"
                  value={formData.dischargeDate || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pharmacist" className="text-xs font-medium text-gray-700">
                  Pharmacist
                </Label>
                <Input
                  id="pharmacist"
                  name="pharmacist"
                  value={formData.pharmacist || ""}
                  onChange={handleInputChange}
                  className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">List Prepared</Label>
                <div className="h-9 px-3 py-2 bg-white/90 rounded-md flex items-center text-sm text-gray-600 border border-gray-300 shadow-sm">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Medications Stopped During Hospital (for after-admission template) */}
          {(templateType === "after-admission" || templateType === "hospital-specific") && (
            <>
              <div className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-600 pl-4 mt-6">
                Medications Stopped During Hospital
              </div>
              <div className="space-y-4 p-4 rounded-xl bg-white/70 shadow-inner border border-white/40">
                <div className="space-y-1">
                  <Label htmlFor="commentsStoppedMedications" className="text-xs font-medium text-gray-700">
                    MEDICATIONS STOPPED DURING HOSPITAL
                  </Label>
                  <p className="text-xs text-gray-600 italic">
                    Do not take these medications unless advised by your GP.
                  </p>
                  <Label htmlFor="commentsStoppedMedications" className="text-xs font-medium text-gray-700">
                    Comments:
                  </Label>
                  <AutoResizeTextarea
                    id="commentsStoppedMedications"
                    name="commentsStoppedMedications"
                    value={formData.commentsStoppedMedications || ""}
                    onChange={handleInputChange}
                    placeholder="Enter comments about stopped medications..."
                    className="text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                  />
                </div>
              </div>
            </>
          )}

          {/* Medication Table Section */}
          <div className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-600 pl-4 mt-6">
            Medication List
          </div>
          <div className="overflow-x-auto rounded-xl shadow-lg border border-white/40 bg-white/70">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                {templateType === "before-admission" ? (
                  <TableRow className="border-b border-white/30">
                    <TableHead className="w-[200px] text-xs text-gray-800 font-semibold">Medication</TableHead>
                    <TableHead className="min-w-[150px] text-xs text-gray-800 font-semibold">
                      Dosage and Frequency
                    </TableHead>
                    <TableHead className="min-w-[120px] text-xs text-gray-800 font-semibold">Home med or New</TableHead>
                    <TableHead className="min-w-[120px] text-xs text-gray-800 font-semibold">
                      Currently Charted?
                    </TableHead>
                    <TableHead className="min-w-[200px] text-xs text-gray-800 font-semibold">
                      Comments/Actions
                    </TableHead>
                    <TableHead className="min-w-[150px] text-xs text-gray-800 font-semibold">
                      Dr to sign when action completed
                    </TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                ) : (
                  <TableRow className="border-b border-white/30">
                    <TableHead className="w-[200px] text-xs text-gray-800 font-semibold">Medication</TableHead>
                    {timeSlots.map((slot) => (
                      <TableHead key={slot} className="min-w-[60px] text-center text-xs text-gray-800 font-semibold">
                        {slot.toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[120px] text-xs text-gray-800 font-semibold">Status</TableHead>
                    <TableHead className="min-w-[150px] text-xs text-gray-800 font-semibold">Comments</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {formData.medications.map((med, index) => (
                  <TableRow
                    key={med.id}
                    className="h-12 border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <TableCell className="py-1">
                      <MedicationSearch
                        value={med.name}
                        onChange={(selectedMed) => handleMedicationSelection(index, selectedMed)}
                        placeholder="Search medication..."
                      />
                    </TableCell>
                    {templateType === "before-admission" ? (
                      <>
                        <TableCell className="py-1">
                          <Input
                            value={(med as Medication).dosageFrequency || ""}
                            onChange={(e) => handleMedicationChange(index, "dosageFrequency", e.target.value)}
                            className="text-xs p-1 h-8 bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <HomeNewStatusCombobox
                            value={(med as Medication).homeNewStatus || ""}
                            onChange={(value) => handleMedicationChange(index, "homeNewStatus", value)}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <ChartedStatusCombobox
                            value={(med as Medication).chartedStatus || ""}
                            onChange={(value) => handleMedicationChange(index, "chartedStatus", value)}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <AutoResizeTextarea
                            value={(med as Medication).commentsActions || ""}
                            onChange={(e) => handleMedicationChange(index, "commentsActions", e.target.value)}
                            placeholder="Enter comments/actions..."
                            className="text-xs bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <Input
                            value={(med as Medication).drSignActionCompleted || ""}
                            onChange={(e) => handleMedicationChange(index, "drSignActionCompleted", e.target.value)}
                            className="text-xs p-1 h-8 bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        {timeSlots.map((slot) => (
                          <TableCell key={slot} className="py-1">
                            <Input
                              value={(med as Medication).times?.[slot] || ""}
                              onChange={(e) => handleMedicationChange(index, `times.${slot}`, e.target.value)}
                              className="text-center text-xs p-1 h-8 bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="py-1">
                          <MedicationStatusCombobox
                            value={(med as Medication).status || ""}
                            onChange={(value) => handleMedicationChange(index, "status", value)}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <AutoResizeTextarea
                            value={(med as Medication).comments || ""}
                            onChange={(e) => handleMedicationChange(index, "comments", e.target.value)}
                            placeholder="Enter comments..."
                            className="text-xs bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                          />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedicationRow(index)}
                        disabled={formData.medications.length === 1}
                        className="h-8 w-8 text-red-500 hover:bg-red-100/50 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button
            variant="outline"
            onClick={addMedicationRow}
            className="mt-4 h-9 text-sm font-semibold rounded-xl px-4 py-2
                      text-purple-600 border border-purple-600
                      hover:bg-purple-50
                      shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Medication
          </Button>

          {/* Additional Sections for Before Admission Template */}
          {templateType === "before-admission" && (
            <>
              <div className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-600 pl-4 mt-6">
                Additional Information
              </div>
              <div className="space-y-4 p-4 rounded-xl bg-white/70 shadow-inner border border-white/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="reasonForAdmission" className="text-xs font-medium text-gray-700">
                      Reason for Admission
                    </Label>
                    <AutoResizeTextarea
                      id="reasonForAdmission"
                      name="reasonForAdmission"
                      value={formData.reasonForAdmission || ""}
                      onChange={handleInputChange}
                      placeholder="Enter reason for admission..."
                      className="text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relevantPastMedicalHistory" className="text-xs font-medium text-gray-700">
                      Relevant Past Medical History
                    </Label>
                    <AutoResizeTextarea
                      id="relevantPastMedicalHistory"
                      name="relevantPastMedicalHistory"
                      value={formData.relevantPastMedicalHistory || ""}
                      onChange={handleInputChange}
                      placeholder="Enter relevant past medical history..."
                      className="text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="communityPharmacist" className="text-xs font-medium text-gray-700">
                      Community Pharmacist
                    </Label>
                    <Input
                      id="communityPharmacist"
                      name="communityPharmacist"
                      value={formData.communityPharmacist || ""}
                      onChange={handleInputChange}
                      className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="generalPractitioner" className="text-xs font-medium text-gray-700">
                      General Practitioner
                    </Label>
                    <Input
                      id="generalPractitioner"
                      name="generalPractitioner"
                      value={formData.generalPractitioner || ""}
                      onChange={handleInputChange}
                      className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="medicationRisksComments" className="text-xs font-medium text-gray-700">
                    Medication Risks Identified and Pharmacist's Comments:
                  </Label>
                  <AutoResizeTextarea
                    id="medicationRisksComments"
                    name="medicationRisksComments"
                    value={formData.medicationRisksComments || ""}
                    onChange={handleInputChange}
                    placeholder="Enter medication risks and pharmacist's comments..."
                    className="text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourcesOfHistory" className="text-xs font-medium text-gray-700">
                    Sources of History (at least two sources)
                  </Label>
                  <AutoResizeTextarea
                    id="sourcesOfHistory"
                    name="sourcesOfHistory"
                    value={formData.sourcesOfHistory || ""}
                    onChange={handleInputChange}
                    placeholder="Enter sources of history..."
                    className="text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/40">
                  <div className="space-y-1">
                    <Label htmlFor="pharmacistSignature" className="text-xs font-medium text-gray-700">
                      Pharmacist:
                    </Label>
                    <Input
                      id="pharmacistSignature"
                      name="pharmacistSignature"
                      value={formData.pharmacistSignature || ""}
                      onChange={handleInputChange}
                      className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dateTimeSigned" className="text-xs font-medium text-gray-700">
                      Date/Time:
                    </Label>
                    <Input
                      id="dateTimeSigned"
                      name="dateTimeSigned"
                      type="datetime-local"
                      value={formData.dateTimeSigned || ""}
                      onChange={handleInputChange}
                      className="h-9 text-sm bg-white/90 border border-gray-300 shadow-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Text Section (always present) */}
          <div className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-purple-600 pl-4 mt-6">
            Important Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 bg-white/70 p-4 rounded-xl shadow-inner border border-white/40">
            <p className="text-xs leading-relaxed">
              This list is your medication management plan as determined by your doctor at iMH Hirondelle Private
              Hospital, at the time of discharge listed above. The list is confirmed as accurate when signed by a
              medical practitioner, below. Please see your General Practitioner soon after discharge from hospital for
              review of your medications.
            </p>
            <p className="text-xs leading-relaxed">
              TerryWhite Chemmart Manly Corso Pharmacy is the authorised pharmacy for iMH Hirondelle Private Hospital.
              To speak to a pharmacist or pay your pharmacy statement call 02 9977 2095. Open 7:30am to 7:30pm every
              day. Address: 72 The Corso Manly 2095. Email: pharmacist@manlypharmacy.com.au
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 justify-end pt-4 border-t border-white/20 bg-gradient-to-l from-blue-50/50 to-purple-50/50 rounded-b-3xl p-6">
          <Button
            onClick={handleDownloadExcel}
            variant="outline"
            size="sm"
            className="h-10 text-sm font-semibold rounded-xl px-5 py-2
                       bg-gradient-to-r from-blue-400 to-purple-400 text-white
                       hover:from-blue-500 hover:to-purple-500
                       shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
          </Button>
          <Button
            onClick={handleSaveAndPrint}
            variant="outline"
            size="sm"
            className="h-10 text-sm font-semibold rounded-xl px-5 py-2
                       bg-gradient-to-r from-blue-400 to-purple-400 text-white
                       hover:from-blue-500 hover:to-purple-500
                       shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <Printer className="h-4 w-4 mr-2" /> Save & Print
          </Button>
          <Button
            onClick={handleSubmitToDischarge}
            size="sm"
            className="h-10 text-sm font-semibold rounded-xl px-5 py-2
                       bg-gradient-to-r from-blue-400 to-purple-400 text-white
                       hover:from-blue-500 hover:to-purple-500
                       shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <Send className="h-4 w-4 mr-2" /> Send to Discharge
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
