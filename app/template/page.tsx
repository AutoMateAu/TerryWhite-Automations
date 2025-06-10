"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Send, Printer, FileSpreadsheet } from "lucide-react" // Added FileSpreadsheet icon
import type { PatientFormData, Medication, MedicationWithComment } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { mockDischargedPatients } from "@/lib/data" // For simulating data transfer
import { MedicationSearch } from "@/components/medication-search"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { MedicationStatusCombobox } from "@/components/medication-status-combobox"
import { exportMedicationsToExcel } from "@/lib/export-excel" // Import the new export function

// Replace the initialMedication constant with this function
const createEmptyMedication = (): Medication => ({
  id: Date.now().toString() + Math.random(), // Ensure unique ID
  name: "",
  times: { "7am": "", "8am": "", Noon: "", "2pm": "", "6pm": "", "8pm": "", "10pm": "" },
  status: "",
  comments: "",
})

const initialFormData: PatientFormData = {
  name: "",
  address: "",
  medicare: "",
  allergies: "",
  dob: "",
  mrn: "",
  admissionDate: "",
  dischargeDate: "",
  pharmacist: "",
  dateListPrepared: new Date().toISOString().split("T")[0], // Auto-set to today's date
  medications: [createEmptyMedication()], // Use the function here
}

export default function TemplatePage() {
  const [formData, setFormData] = useState<PatientFormData>({
    ...initialFormData,
    dateListPrepared: new Date().toISOString().split("T")[0], // Ensure it's always today's date
  })
  const [phoneNumber, setPhoneNumber] = useState("")
  const { toast } = useToast()
  const router = useRouter()

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
      newMedications[index].times[timeKey] = value
    } else {
      ;(newMedications[index] as any)[field] = value
    }
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const handleMedicationSelection = (index: number, medicationWithComment: MedicationWithComment | null) => {
    const newMedications = [...formData.medications]
    if (medicationWithComment) {
      newMedications[index].name = medicationWithComment.name
      newMedications[index].comments = medicationWithComment.comment || ""

      // Auto-create new empty row if this is the last row and we just selected a medication
      if (index === formData.medications.length - 1) {
        newMedications.push(createEmptyMedication()) // Use the function to create a fresh empty row
      }
    } else {
      newMedications[index].name = ""
      newMedications[index].comments = ""
    }
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const addMedicationRow = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, createEmptyMedication()], // Use the function here too
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
    return (
      !medication.name.trim() &&
      !medication.status.trim() &&
      !medication.comments.trim() &&
      Object.values(medication.times).every((time) => !time.trim())
    )
  }

  const handleSaveAndPrint = () => {
    // Filter out empty medication rows
    const medicationsWithData = formData.medications.filter((med) => !isMedicationRowEmpty(med))

    if (medicationsWithData.length === 0) {
      toast({
        title: "No Medications to Save",
        description: "Please add at least one medication before saving.",
        variant: "destructive",
      })
      return
    }

    const formDataForSaving = {
      ...formData,
      medications: medicationsWithData,
    }

    const newDischargedPatient: PatientFormData & { id: string; dischargeTimestamp: string } = {
      ...formDataForSaving,
      id: `discharge-${Date.now()}`,
      dischargeTimestamp: new Date().toISOString(),
    }

    mockDischargedPatients.push(newDischargedPatient)

    toast({
      title: "Medication Plan Saved",
      description: `Medication plan for ${formData.name} has been saved and is ready for printing.`,
    })

    // Here you would typically trigger the print functionality
    // For now, we'll just show a message
    setTimeout(() => {
      toast({
        title: "Print Ready",
        description: "The medication plan is ready to be printed.",
      })
    }, 1000)
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
    exportMedicationsToExcel(medicationsToExport, formData.name || "Patient")
    toast({
      title: "Medications Exported",
      description: "The medication list has been downloaded as an Excel file.",
    })
  }

  const handleSubmitToDischarge = () => {
    // Simulate sending data to discharge
    // In a real app, this would involve an API call or state management update
    const newDischargedPatient: PatientFormData & { id: string; dischargeTimestamp: string } = {
      ...formData,
      id: `discharge-${Date.now()}`,
      dischargeTimestamp: new Date().toISOString(),
    }
    mockDischargedPatients.push(newDischargedPatient) // Add to mock data

    toast({
      title: "Template Sent to Discharge",
      description: `Medication plan for ${formData.name} has been prepared.`,
    })
    setFormData({
      ...initialFormData,
      medications: [createEmptyMedication()],
      dateListPrepared: new Date().toISOString().split("T")[0], // Reset with today's date
    })
    setPhoneNumber("") // Reset phone number
    router.push("/discharge") // Navigate to discharge page
  }

  const timeSlots: (keyof Medication["times"])[] = ["7am", "8am", "Noon", "2pm", "6pm", "8pm", "10pm"]

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Medication Management Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Information Section - More Compact Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border p-3 rounded-md bg-gray-50 dark:bg-gray-900">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium">
                Name
              </Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob" className="text-xs font-medium">
                DOB
              </Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mrn" className="text-xs font-medium">
                MRN
              </Label>
              <Input id="mrn" name="mrn" value={formData.mrn} onChange={handleInputChange} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-xs font-medium">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-8 text-sm"
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="address" className="text-xs font-medium">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medicare" className="text-xs font-medium">
                Medicare
              </Label>
              <Input
                id="medicare"
                name="medicare"
                value={formData.medicare}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="allergies" className="text-xs font-medium">
                Allergies
              </Label>
              <Input
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admissionDate" className="text-xs font-medium">
                Admission Date
              </Label>
              <Input
                id="admissionDate"
                name="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dischargeDate" className="text-xs font-medium">
                Discharge Date
              </Label>
              <Input
                id="dischargeDate"
                name="dischargeDate"
                type="date"
                value={formData.dischargeDate}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pharmacist" className="text-xs font-medium">
                Pharmacist
              </Label>
              <Input
                id="pharmacist"
                name="pharmacist"
                value={formData.pharmacist}
                onChange={handleInputChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">List Prepared</Label>
              <div className="h-8 px-2 py-1 bg-muted rounded-md flex items-center text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Medication Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-[200px] text-xs">Medication</TableHead>
                  {timeSlots.map((slot) => (
                    <TableHead key={slot} className="min-w-[60px] text-center text-xs">
                      {slot.toUpperCase()}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[120px] text-xs">Status</TableHead>
                  <TableHead className="min-w-[150px] text-xs">Comments</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.medications.map((med, index) => (
                  <TableRow key={med.id} className="h-12">
                    <TableCell className="py-1">
                      <MedicationSearch
                        value={med.name}
                        onChange={(selectedMed) => handleMedicationSelection(index, selectedMed)}
                        placeholder="Search medication..."
                      />
                    </TableCell>
                    {timeSlots.map((slot) => (
                      <TableCell key={slot} className="py-1">
                        <Input
                          value={med.times[slot]}
                          onChange={(e) => handleMedicationChange(index, `times.${slot}`, e.target.value)}
                          className="text-center text-xs p-1 h-7"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="py-1">
                      <MedicationStatusCombobox
                        value={med.status}
                        onChange={(value) => handleMedicationChange(index, "status", value)}
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <AutoResizeTextarea
                        value={med.comments}
                        onChange={(e) => handleMedicationChange(index, "comments", e.target.value)}
                        placeholder="Enter comments..."
                        className="text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedicationRow(index)}
                        disabled={formData.medications.length === 1}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" onClick={addMedicationRow} className="mt-2 h-8 text-xs">
            <PlusCircle className="h-3 w-3 mr-2" /> Add Medication
          </Button>

          {/* Footer Text Section - More Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
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
        <CardFooter className="flex gap-2 justify-end pt-4">
          <Button onClick={handleDownloadExcel} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
          </Button>
          <Button onClick={handleSaveAndPrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" /> Save & Print
          </Button>
          <Button onClick={handleSubmitToDischarge} size="sm">
            <Send className="h-4 w-4 mr-2" /> Send to Discharge
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
