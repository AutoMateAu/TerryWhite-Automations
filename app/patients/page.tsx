"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, CalendarDays, MapPin, FileIcon as FileMedical, Pill, Phone } from "lucide-react"
import type { PatientProfile } from "@/lib/types"
import { mockPatients } from "@/lib/data"
import { Button } from "@/components/ui/button" // Added import
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { AddPatientForm } from "@/components/add-patient-form"
import { useToast } from "@/components/ui/use-toast"

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // In a real app, fetch this data
    setPatients(mockPatients.sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  const handleAddNewPatient = (newPatientData: Omit<PatientProfile, "id">) => {
    const newPatient: PatientProfile = {
      ...newPatientData,
      id: `patient-${Date.now()}`,
    }
    // Simulate adding to the backend
    mockPatients.push(newPatient)
    // Update UI state
    setPatients((prev) => [...prev, newPatient].sort((a, b) => a.name.localeCompare(b.name)))
    toast({
      title: "Patient Added",
      description: `${newPatient.name} has been successfully added to the system.`,
    })
    setIsDialogOpen(false) // Close the dialog
  }

  const filteredPatients = patients
    .filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Patient</Button>
          </DialogTrigger>
          <AddPatientForm onPatientAdd={handleAddNewPatient} />
        </Dialog>
      </div>

      <Input
        type="search"
        placeholder="Search patients by name, MRN, or phone number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6"
      />

      {filteredPatients.length === 0 && <p>No patients found.</p>}

      <Accordion type="single" collapsible className="w-full space-y-4">
        {filteredPatients.map((patient) => (
          <AccordionItem value={patient.id} key={patient.id} className="border rounded-lg">
            <AccordionTrigger className="p-4 hover:bg-muted/50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">{patient.name}</span>
                <span className="text-sm text-muted-foreground">(MRN: {patient.mrn})</span>
                {patient.phone && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.phone}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Phone:</strong> {patient.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Address:</strong> {patient.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileMedical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Medicare:</strong> {patient.medicare}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Allergies:</strong> {patient.allergies}
                    </span>
                  </div>

                  <h4 className="font-semibold mt-4 pt-3 border-t">Current Medications:</h4>
                  {patient.currentMedications.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {patient.currentMedications.map((med, index) => (
                        <li key={index}>
                          {med.name} - {med.dosage} ({med.frequency})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No current medications listed.</p>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
