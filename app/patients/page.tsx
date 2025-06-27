"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { User, Phone } from "lucide-react"
import type { PatientProfile } from "@/lib/types"
import { getPatients, upsertPatient } from "@/services/accounting-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddPatientFormContent } from "@/components/add-patient-form-content"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPatientsData = async () => {
      setLoadingPatients(true)
      const fetchedPatients = await getPatients()
      setPatients(fetchedPatients)
      setLoadingPatients(false)
    }
    fetchPatientsData()
  }, [])

  const handleAddNewPatient = async (newPatientData: Omit<PatientProfile, "id">) => {
    const result = await upsertPatient(newPatientData)
    if (result.success && result.patient) {
      setPatients((prev) => [...prev, result.patient!].sort((a, b) => a.name.localeCompare(b.name)))
      toast({
        title: "Patient Added",
        description: `${result.patient.name} has been successfully added to the system.`,
      })
      setIsAddPatientDialogOpen(false) // Close dialog on success
    } else {
      toast({
        title: "Failed to Add Patient",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      })
    }
  }

  const filteredPatients = patients
    .filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  if (loadingPatients) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading patients...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold inline-block border-b-2 border-purple-600">Patients</h2>
        <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border border-purple-600 text-purple-600 bg-white hover:bg-purple-50">
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle></DialogTitle>
            </DialogHeader>
            <AddPatientFormContent
              onPatientAdd={handleAddNewPatient}
              onClose={() => setIsAddPatientDialogOpen(false)}
            />
          </DialogContent>
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
            <AccordionTrigger asChild className="p-4 hover:bg-purple-50 rounded-t-lg group">
              <Link href={`/patients/${patient.id}`} className="flex items-center gap-3 w-full">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium group-hover:text-purple-600">{patient.name}</span>
                <span className="text-sm text-muted-foreground">(MRN: {patient.mrn})</span>
                {patient.phone && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.phone}
                  </span>
                )}
              </Link>
            </AccordionTrigger>
            {/* AccordionContent is removed as details are now on a dedicated page */}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
