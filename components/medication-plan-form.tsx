"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea" // Changed to AutoResizeTextarea
import { PlusIcon, EditIcon } from "lucide-react"
import type { DischargedPatient, Medication, Hospital } from "@/lib/types"
import { createDischargedForm, updateDischargedForm } from "@/services/accounting-service"
import { useRouter } from "next/navigation"
import { MedicationSearch } from "./medication-search"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getHospitals } from "@/lib/hospitals"
import { getUserSessionAndProfile } from "@/lib/auth"

interface MedicationPlanFormProps {
  initialData?: DischargedPatient
}

export default function MedicationPlanForm({ initialData }: MedicationPlanFormProps) {
  // Changed to default export
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [patientName, setPatientName] = useState(initialData?.patient_name || "")
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || "")
  const [dischargeDate, setDischargeDate] = useState(initialData?.discharge_date || "")
  const [medications, setMedications] = useState<Medication[]>(initialData?.medications || [])
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [template, setTemplate] = useState(initialData?.template || "")
  const [hospitalId, setHospitalId] = useState<string | null>(initialData?.hospital_id || null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userHospitalId, setUserHospitalId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { hospitals: fetchedHospitals, error: hospitalsError } = await getHospitals()
      if (hospitalsError) {
        console.error("Error fetching hospitals:", hospitalsError)
      } else {
        setHospitals(fetchedHospitals || [])
      }

      const { profile } = await getUserSessionAndProfile()
      setUserRole(profile?.role || null)
      setUserHospitalId(profile?.hospital_id || null)

      // If user is doctor/nurse, pre-select their hospital and disable selection
      if ((profile?.role === "doctor" || profile?.role === "nurse") && profile?.hospital_id) {
        setHospitalId(profile.hospital_id)
      }
    }
    fetchData()
  }, [])

  const handleAddMedication = (medication: Medication) => {
    setMedications((prev) => {
      if (prev.some((m) => m.id === medication.id)) {
        return prev
      }
      return [...prev, medication]
    })
  }

  const handleRemoveMedication = (medicationId: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== medicationId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const formData = {
        patient_name: patientName,
        diagnosis,
        discharge_date: dischargeDate,
        medications,
        notes,
        template,
        hospital_id: hospitalId,
      }

      let result
      if (initialData) {
        result = await updateDischargedForm(initialData.id, formData)
      } else {
        result = await createDischargedForm(formData)
      }

      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        alert(`Error: ${result.message}`)
      }
    })
  }

  const isDoctorOrNurse = userRole === "doctor" || userRole === "nurse"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={initialData ? "ghost" : "default"} size={initialData ? "icon" : "default"}>
          {initialData ? <EditIcon className="h-4 w-4" /> : <PlusIcon className="mr-2 h-4 w-4" />}
          {initialData ? <span className="sr-only">Edit</span> : "New Discharge Summary"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Discharge Summary" : "Create New Discharge Summary"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Make changes to the existing discharge summary here."
              : "Fill in the details for a new patient discharge summary."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientName" className="text-right">
              Patient Name
            </Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="diagnosis" className="text-right">
              Diagnosis
            </Label>
            <Input
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dischargeDate" className="text-right">
              Discharge Date
            </Label>
            <Input
              id="dischargeDate"
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hospital" className="text-right">
              Hospital
            </Label>
            <Select
              value={hospitalId || ""}
              onValueChange={(value) => setHospitalId(value)}
              disabled={isDoctorOrNurse && !!userHospitalId} // Disable if doctor/nurse and hospital is set
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="medications" className="text-right pt-2">
              Medications
            </Label>
            <div className="col-span-3 space-y-2">
              <MedicationSearch onSelectMedication={handleAddMedication} />
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medications added.</p>
                ) : (
                  <ul className="space-y-1">
                    {medications.map((med) => (
                      <li key={med.id} className="flex items-center justify-between text-sm">
                        <span>
                          {med.name} ({med.dosage})
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMedication(med.id)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <AutoResizeTextarea // Changed to AutoResizeTextarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Any additional notes or instructions..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <AutoResizeTextarea // Changed to AutoResizeTextarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="col-span-3"
              placeholder="Enter template content here..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : initialData ? "Save Changes" : "Create Summary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
