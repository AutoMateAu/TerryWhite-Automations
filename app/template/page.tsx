"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Send } from "lucide-react"
import type { PatientFormData, Medication } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { mockDischargedPatients } from "@/lib/data" // For simulating data transfer
import { MedicationSearch } from "@/components/medication-search"
import { formatAustralianPhoneNumber, getPhoneNumberMaxLength } from "@/utils/phone-formatter"

const initialMedication: Medication = {
  id: Date.now().toString(),
  name: "",
  times: { "7am": "", "8am": "", Noon: "", "2pm": "", "6pm": "", "8pm": "", "10pm": "" },
  status: "",
  comments: "",
}

const initialFormData: PatientFormData = {
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
  dateListPrepared: "",
  medications: [initialMedication],
}

export default function TemplatePage() {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData)
  const { toast } = useToast()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAustralianPhoneNumber(e.target.value)
    setFormData((prev) => ({ ...prev, phone: formatted }))
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

  const handleMedicationNameChange = (index: number, value: string) => {
    const newMedications = [...formData.medications]
    newMedications[index].name = value
    setFormData((prev) => ({ ...prev, medications: newMedications }))
  }

  const addMedicationRow = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...initialMedication, id: Date.now().toString() }],
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
    setFormData(initialFormData) // Reset form
    router.push("/discharge") // Navigate to discharge page
  }

  const timeSlots: (keyof Medication["times"])[] = ["7am", "8am", "Noon", "2pm", "6pm", "8pm", "10pm"]

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Medication Management Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border p-4 rounded-md">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="dob">DOB</Label>
              <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="mrn">MRN</Label>
              <Input id="mrn" name="mrn" value={formData.mrn} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handlePhoneChange}
                placeholder="0412 345 678 or (02) 9876 5432"
                maxLength={getPhoneNumberMaxLength(formData.phone || "")}
              />
              <p className="text-xs text-muted-foreground mt-1">Mobile: 04XX XXX XXX • Landline: (0X) XXXX XXXX</p>
            </div>
            <div>
              <Label htmlFor="medicare">Medicare</Label>
              <Input id="medicare" name="medicare" value={formData.medicare} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="admissionDate">Admission Date</Label>
              <Input
                id="admissionDate"
                name="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Input id="allergies" name="allergies" value={formData.allergies} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="dischargeDate">Discharge Date</Label>
              <Input
                id="dischargeDate"
                name="dischargeDate"
                type="date"
                value={formData.dischargeDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="pharmacist">Pharmacist</Label>
              <Input id="pharmacist" name="pharmacist" value={formData.pharmacist} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="dateListPrepared">Date List Prepared</Label>
              <Input
                id="dateListPrepared"
                name="dateListPrepared"
                type="date"
                value={formData.dateListPrepared}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Medication Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-[250px]">Medication</TableHead>
                  {timeSlots.map((slot) => (
                    <TableHead key={slot} className="min-w-[70px] text-center">
                      {slot.toUpperCase()}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[150px]">Medication Status</TableHead>
                  <TableHead className="min-w-[200px]">Comments</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.medications.map((med, index) => (
                  <TableRow key={med.id}>
                    <TableCell>
                      <MedicationSearch
                        value={med.name}
                        onChange={(value) => handleMedicationNameChange(index, value)}
                        placeholder="Search medication..."
                      />
                    </TableCell>
                    {timeSlots.map((slot) => (
                      <TableCell key={slot}>
                        <Input
                          value={med.times[slot]}
                          onChange={(e) => handleMedicationChange(index, `times.${slot}`, e.target.value)}
                          className="text-center text-xs p-1 h-8"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Input
                        value={med.status}
                        onChange={(e) => handleMedicationChange(index, "status", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={med.comments}
                        onChange={(e) => handleMedicationChange(index, "comments", e.target.value)}
                        rows={1}
                        className="min-h-[38px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedicationRow(index)}
                        disabled={formData.medications.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" onClick={addMedicationRow} className="mt-2">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Medication
          </Button>

          {/* Footer Text Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <p>
              This list is your medication management plan as determined by your doctor at iMH Hirondelle Private
              Hospital, at the time of discharge listed above. The list is confirmed as accurate when signed by a
              medical practitioner, below. Please see your General Practitioner soon after discharge from hospital for
              review of your medications.
            </p>
            <p>
              TerryWhite Chemmart Manly Corso Pharmacy is the authorised pharmacy for iMH Hirondelle Private Hospital.
              To speak to a pharmacist or pay your pharmacy statement call 02 9977 2095. Open 7:30am to 7:30pm every
              day. Address: 72 The Corso Manly 2095. Email: pharmacist@manlypharmacy.com.au
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmitToDischarge} size="lg" className="ml-auto">
            <Send className="h-4 w-4 mr-2" /> Send to Discharge
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
