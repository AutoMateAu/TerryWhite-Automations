"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
// import MedicationPlanForm from "@/components/medication-plan-form" // No longer needed here
import { useToast } from "@/components/ui/use-toast"
import type { PatientFormData } from "@/lib/types"

interface NewDischargeDrawerProps {
  isOpen: boolean
  onClose: () => void
  hospitals: { id: string; name: string }[]
}

// type Step = "selection" | "form" // Removed as form is now on a new page

const initialNewPatientData: Partial<PatientFormData> = {
  name: "",
  dob: "",
  mrn: "",
  address: "",
  medicare: "",
  allergies: "",
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
}

export default function NewDischargeDrawer({ isOpen, onClose, hospitals }: NewDischargeDrawerProps) {
  // const [step, setStep] = useState<Step>("selection") // Removed
  const [selectedTemplateType, setSelectedTemplateType] = useState<"admission" | "discharge" | "">("") // Simplified to 'admission' or 'discharge'
  const [selectedHospitalName, setSelectedHospitalName] = useState<string | undefined>(undefined)
  const [isNewHospital, setIsNewHospital] = useState(false) // State for new hospital input
  const [newHospitalNameInput, setNewHospitalNameInput] = useState("") // Input for new hospital name
  const [patientType, setPatientType] = useState<"existing" | "new">("new")
  const [existingPatientSearch, setExistingPatientSearch] = useState("") // For existing patient search
  const { toast } = useToast()
  const router = useRouter() // Initialize useRouter

  // Reset state when drawer opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      // setStep("selection") // Removed
      setSelectedTemplateType("")
      setSelectedHospitalName(undefined)
      setIsNewHospital(false)
      setNewHospitalNameInput("")
      setPatientType("new")
      setExistingPatientSearch("")
    }
  }, [isOpen])

  const handleProceedToForm = () => {
    if (!selectedTemplateType) {
      toast({ title: "Missing Information", description: "Please select a discharge type.", variant: "destructive" })
      return
    }
    if (!selectedHospitalName && !isNewHospital) {
      toast({ title: "Missing Information", description: "Please select or add a hospital.", variant: "destructive" })
      return
    }
    if (isNewHospital && !newHospitalNameInput.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the new hospital's name.",
        variant: "destructive",
      })
      return
    }
    // For existing patient, we'd ideally validate search term or selection here
    if (patientType === "existing" && !existingPatientSearch.trim()) {
      toast({
        title: "Missing Information",
        description: "Please search for an existing patient.",
        variant: "destructive",
      })
      return
    }

    const currentHospital = isNewHospital ? newHospitalNameInput : selectedHospitalName

    // Construct query parameters for the new page
    const queryParams = new URLSearchParams()
    queryParams.set("templateType", selectedTemplateType)
    queryParams.set("hospitalName", currentHospital || "N/A") // Ensure hospitalName is always set
    queryParams.set("patientType", patientType)

    if (patientType === "existing") {
      queryParams.set("patientName", existingPatientSearch)
      // In a real app, you'd pass actual patient ID/data here
      // For now, we'll just pass the search term as the name for demonstration
    }
    // No need to pass new patient data, as the form will start empty for new patients

    router.push(`/discharge/create?${queryParams.toString()}`)
    onClose() // Close the drawer after navigating
  }

  // const handleBackToSelection = () => { // Removed as there's no internal step back
  //   setStep("selection")
  // }

  // Removed getInitialFormDataForForm as it's now handled by the new page

  const currentHospitalName = isNewHospital ? newHospitalNameInput : selectedHospitalName

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-gray-200">
          <SheetTitle className="text-2xl font-bold text-gray-900">Create New Discharge</SheetTitle>
          <SheetDescription className="text-gray-500">
            Select the type of discharge, patient, and hospital details.
          </SheetDescription>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type of Discharge</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant={selectedTemplateType === "admission" ? "default" : "outline"}
                onClick={() => setSelectedTemplateType("admission")}
                className={
                  selectedTemplateType === "admission"
                    ? "bg-violet-highlight text-white hover:bg-violet-highlight/90"
                    : ""
                }
              >
                Admission Medication Management
              </Button>
              <Button
                variant={selectedTemplateType === "discharge" ? "default" : "outline"}
                onClick={() => setSelectedTemplateType("discharge")}
                className={
                  selectedTemplateType === "discharge"
                    ? "bg-violet-highlight text-white hover:bg-violet-highlight/90"
                    : ""
                }
              >
                Discharge Medication Management
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Patient Type</Label>
            <RadioGroup value={patientType} onValueChange={setPatientType} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="patient-type-new" />
                <Label htmlFor="patient-type-new">New Patient</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="patient-type-existing" />
                <Label htmlFor="patient-type-existing">Existing Patient</Label>
              </div>
            </RadioGroup>
          </div>

          {patientType === "existing" && (
            <div className="space-y-2">
              <Label htmlFor="existing-patient-search">Search Existing Patient (Name or MRN)</Label>
              <Input
                id="existing-patient-search"
                value={existingPatientSearch}
                onChange={(e) => setExistingPatientSearch(e.target.value)}
                placeholder="Search for patient..."
              />
              {/* In a real app, this would trigger a search and display results */}
              <p className="text-sm text-gray-500">
                {existingPatientSearch
                  ? `Searching for: "${existingPatientSearch}"`
                  : "Enter patient name or MRN to search."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Hospital</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hospitals
                .filter((h) => h.id !== "all")
                .map((hospital) => (
                  <Button
                    key={hospital.id}
                    variant={selectedHospitalName === hospital.name && !isNewHospital ? "default" : "outline"}
                    onClick={() => {
                      setSelectedHospitalName(hospital.name)
                      setIsNewHospital(false)
                      setNewHospitalNameInput("")
                    }}
                    className={
                      selectedHospitalName === hospital.name && !isNewHospital
                        ? "bg-violet-highlight text-white hover:bg-violet-highlight/90"
                        : ""
                    }
                  >
                    {hospital.name}
                  </Button>
                ))}
              <Button
                variant={isNewHospital ? "default" : "outline"}
                onClick={() => {
                  setIsNewHospital(true)
                  setSelectedHospitalName(undefined)
                }}
                className={isNewHospital ? "bg-violet-highlight text-white hover:bg-violet-highlight/90" : ""}
              >
                New Hospital
              </Button>
            </div>
            {isNewHospital && (
              <div className="mt-4">
                <Label htmlFor="new-hospital-name-input">New Hospital Name</Label>
                <Input
                  id="new-hospital-name-input"
                  value={newHospitalNameInput}
                  onChange={(e) => setNewHospitalNameInput(e.target.value)}
                  placeholder="Enter new hospital name"
                  required
                />
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 border-t border-gray-200 flex justify-end">
          <Button onClick={handleProceedToForm} className="bg-violet-highlight text-white hover:bg-violet-highlight/90">
            Proceed to Form
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
