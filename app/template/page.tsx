"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Send, Printer, FileSpreadsheet } from "lucide-react"
import type { PatientFormData, Medication, MedicationWithComment } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { mockDischargedPatients } from "@/lib/data"
import { MedicationSearch } from "@/components/medication-search"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { MedicationStatusCombobox } from "@/components/medication-status-combobox"
import { exportMedicationsToExcel } from "@/lib/export-excel"

const createEmptyMedication = (): Medication => ({
  id: Date.now().toString() + Math.random(),
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
  dateListPrepared: new Date().toISOString().split("T")[0],
  medications: [createEmptyMedication()],
}

export default function TemplatePage() {
  const [formData, setFormData] = useState<PatientFormData>({
    ...initialFormData,
    dateListPrepared: new Date().toISOString().split("T")[0],
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

      if (index === formData.medications.length - 1) {
        newMedications.push(createEmptyMedication())
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
      medications: [...prev.medications, createEmptyMedication()],
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
    const newDischargedPatient: PatientFormData & { id: string; dischargeTimestamp: string } = {
      ...formData,
      id: `discharge-${Date.now()}`,
      dischargeTimestamp: new Date().toISOString(),
    }
    mockDischargedPatients.push(newDischargedPatient)

    toast({
      title: "Template Sent to Discharge",
      description: `Medication plan for ${formData.name} has been prepared.`,
    })
    setFormData({
      ...initialFormData,
      medications: [createEmptyMedication()],
      dateListPrepared: new Date().toISOString().split("T")[0],
    })
    setPhoneNumber("")
    router.push("/discharge")
  }

  const timeSlots: (keyof Medication["times"])[] = ["7am", "8am", "Noon", "2pm", "6pm", "8pm", "10pm"]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-futuristic-blue to-futuristic-purple animate-gradient-shift bg-[length:200%_200%]">
      <Card className="max-w-6xl mx-auto rounded-3xl shadow-2xl backdrop-blur-lg bg-white/80 border border-white/30 animate-fade-in-up">
        <CardHeader className="pb-4 border-b border-white/20 bg-gradient-to-r from-futuristic-blue/20 to-futuristic-purple/20 rounded-t-3xl">
          <CardTitle className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
            Medication Management Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Patient Information Section */}
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-xs font-medium text-gray-700">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
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
                value={formData.dischargeDate}
                onChange={handleInputChange}
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pharmacist" className="text-xs font-medium text-gray-700">
                Pharmacist
              </Label>
              <Input
                id="pharmacist"
                name="pharmacist"
                value={formData.pharmacist}
                onChange={handleInputChange}
                className="h-9 text-sm bg-white/90 border-white/50 focus:border-futuristic-blue focus:ring-1 focus:ring-futuristic-blue transition-all duration-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">List Prepared</Label>
              <div className="h-9 px-3 py-2 bg-white/90 rounded-md flex items-center text-sm text-gray-600 border border-white/50">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Medication Table Section */}
          <div className="overflow-x-auto rounded-xl shadow-lg border border-white/40 bg-white/70">
            <Table>
              <TableHeader className="bg-gradient-to-r from-futuristic-green/20 to-futuristic-blue/20">
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
                    {timeSlots.map((slot) => (
                      <TableCell key={slot} className="py-1">
                        <Input
                          value={med.times[slot]}
                          onChange={(e) => handleMedicationChange(index, `times.${slot}`, e.target.value)}
                          className="text-center text-xs p-1 h-8 bg-white/90 border-white/50 focus:border-futuristic-green focus:ring-1 focus:ring-futuristic-green transition-all duration-200"
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
                        className="text-xs bg-white/90 border-white/50 focus:border-futuristic-green focus:ring-1 focus:ring-futuristic-green transition-all duration-200"
                      />
                    </TableCell>
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
            className="mt-4 h-9 text-sm font-semibold rounded-lg px-4 py-2
                       bg-gradient-to-r from-futuristic-green to-futuristic-blue text-white
                       hover:from-futuristic-blue hover:to-futuristic-green
                       shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Medication
          </Button>

          {/* Footer Text Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-gray-700 bg-white/70 p-4 rounded-xl shadow-inner border border-white/40">
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
        <CardFooter className="flex flex-wrap gap-3 justify-end pt-4 border-t border-white/20 bg-gradient-to-l from-futuristic-purple/20 to-futuristic-pink/20 rounded-b-3xl p-6">
          <Button
            onClick={handleDownloadExcel}
            variant="outline"
            size="sm"
            className="h-10 text-sm font-semibold rounded-lg px-5 py-2
                       bg-gradient-to-r from-futuristic-yellow to-futuristic-green text-gray-900
                       hover:from-futuristic-green hover:to-futuristic-yellow
                       shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
          </Button>
          <Button
            onClick={handleSaveAndPrint}
            variant="outline"
            size="sm"
            className="h-10 text-sm font-semibold rounded-lg px-5 py-2
                       bg-gradient-to-r from-futuristic-blue to-futuristic-green text-white
                       hover:from-futuristic-green hover:to-futuristic-blue
                       shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <Printer className="h-4 w-4 mr-2" /> Save & Print
          </Button>
          <Button
            onClick={handleSubmitToDischarge}
            size="sm"
            className="h-10 text-sm font-semibold rounded-lg px-5 py-2
                       bg-gradient-to-r from-futuristic-purple to-futuristic-pink text-white
                       hover:from-futuristic-pink hover:to-futuristic-purple
                       shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
          >
            <Send className="h-4 w-4 mr-2" /> Send to Discharge
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
