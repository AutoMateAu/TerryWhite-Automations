"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Trash2 } from "lucide-react"
import type { PatientProfile } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { formatAustralianPhoneNumber, getPhoneNumberMaxLength } from "@/utils/phone-formatter"

interface AddPatientFormContentProps {
  onPatientAdd: (newPatient: Omit<PatientProfile, "id">) => void
  onClose: () => void // Add onClose prop to close the dialog
}

const initialMedication = { name: "", dosage: "", frequency: "" }
const initialFormState: Omit<PatientProfile, "id"> = {
  name: "",
  dob: "",
  address: "",
  medicare: "",
  allergies: "",
  mrn: "",
  phone: "",
  currentMedications: [initialMedication],
}

export function AddPatientFormContent({ onPatientAdd, onClose }: AddPatientFormContentProps) {
  const [formData, setFormData] = useState(initialFormState)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMedicationChange = (index: number, field: keyof typeof initialMedication, value: string) => {
    const newMedications = [...formData.currentMedications]
    newMedications[index][field] = value
    setFormData((prev) => ({ ...prev, currentMedications: newMedications }))
  }

  const addMedicationRow = () => {
    setFormData((prev) => ({
      ...prev,
      currentMedications: [...prev.currentMedications, { ...initialMedication }],
    }))
  }

  const removeMedicationRow = (index: number) => {
    if (formData.currentMedications.length === 1) {
      toast({ title: "Cannot remove last medication row", variant: "destructive" })
      return
    }
    const newMedications = formData.currentMedications.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, currentMedications: newMedications }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAustralianPhoneNumber(e.target.value)
    setFormData((prev) => ({ ...prev, phone: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.mrn || !formData.dob) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Name, MRN, and DOB.",
        variant: "destructive",
      })
      return
    }
    await onPatientAdd(formData) // Call the prop function
    setFormData(initialFormState) // Reset form
    onClose() // Close the dialog after successful submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
        {/* Patient Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrn">MRN *</Label>
              <Input id="mrn" name="mrn" value={formData.mrn} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="0412 345 678 or (02) 9876 5432"
                maxLength={getPhoneNumberMaxLength(formData.phone)}
              />
              <p className="text-xs text-muted-foreground">Mobile: 04XX XXX XXX • Landline: (0X) XXXX XXXX</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicare">Medicare Number</Label>
              <Input id="medicare" name="medicare" value={formData.medicare} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="e.g., Penicillin, Peanuts, or 'None known'"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Medications Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Current Medications</h3>
          <div className="space-y-3">
            {formData.currentMedications.map((med, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-md bg-muted/30">
                <div className="md:col-span-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Medication Name</Label>
                  <Input
                    placeholder="e.g., Lisinopril 10mg"
                    value={med.name}
                    onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Dosage</Label>
                  <Input
                    placeholder="e.g., 1 tablet"
                    value={med.dosage}
                    onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Input
                    placeholder="e.g., Once daily"
                    value={med.frequency}
                    onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedicationRow(index)}
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addMedicationRow} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Another Medication
          </Button>
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Patient</Button>
      </div>
    </form>
  )
}
