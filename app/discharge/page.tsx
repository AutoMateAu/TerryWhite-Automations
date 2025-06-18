"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Printer, Share2, FileText, UserCircle, CalendarClock } from "lucide-react"
import type { DischargedPatient } from "@/lib/types"
import { getDischargedForms } from "@/services/accounting-service" // Import the new server action
import { Badge } from "@/components/ui/badge"

export default function DischargePage() {
  const [dischargedForms, setDischargedForms] = useState<DischargedPatient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true)
      const forms = await getDischargedForms()
      setDischargedForms(forms)
      setLoading(false)
    }
    fetchForms()
  }, [])

  const handlePrint = (patientName: string) => {
    alert(`Printing form for ${patientName}... (Not implemented)`)
    // window.print(); // This would print the whole page
  }

  const handleSendToHospital = (patientName: string) => {
    alert(`Sending form for ${patientName} to hospital... (Not implemented)`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading discharge summaries...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Discharge Summaries</h1>

      {dischargedForms.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Discharge Summaries Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Create and send a medication plan from the Template page to see it here.</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {dischargedForms.map((form) => (
            <AccordionItem value={form.id} key={form.id} className="border rounded-lg">
              <AccordionTrigger className="p-4 hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{form.name}</span>
                    <span className="text-sm text-muted-foreground">(MRN: {form.mrn})</span>
                    {form.templateType && (
                      <Badge variant="secondary" className="ml-2">
                        {form.templateType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    )}
                    {form.hospitalName && (
                      <Badge variant="outline" className="ml-1">
                        {form.hospitalName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>Prepared: {new Date(form.dischargeTimestamp).toLocaleString()}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t">
                <Card>
                  <CardHeader>
                    <CardTitle>Medication Plan for {form.name}</CardTitle>
                    <CardDescription>
                      DOB: {form.dob ? new Date(form.dob).toLocaleDateString() : "N/A"} | Allergies:{" "}
                      {form.allergies || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">Medications:</h4>
                    {form.medications && form.medications.length > 0 ? (
                      form.medications.map((med: any, index: number) => (
                        <div key={med.id || index} className="mb-3 p-2 border rounded-md text-sm">
                          <p>
                            <strong>{med.name || "Unnamed Medication"}</strong>
                          </p>
                          {form.templateType === "before-admission" ? (
                            <>
                              <p>Dosage/Frequency: {med.dosageFrequency || "N/A"}</p>
                              <p>
                                Home/New: <Badge variant="outline">{med.homeNewStatus || "N/A"}</Badge>
                              </p>
                              <p>
                                Charted: <Badge variant="outline">{med.chartedStatus || "N/A"}</Badge>
                              </p>
                              <p>Comments/Actions: {med.commentsActions || "None"}</p>
                              <p>Dr Sign: {med.drSignActionCompleted || "N/A"}</p>
                            </>
                          ) : (
                            <>
                              <p>
                                Status: <Badge variant="outline">{med.status || "N/A"}</Badge>
                              </p>
                              <p>Comments: {med.comments || "None"}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-1">
                                {Object.entries(med.times || {}).map(
                                  ([time, dose]) =>
                                    dose && (
                                      <p key={time} className="text-xs">
                                        <strong>{time.toUpperCase()}:</strong> {dose}
                                      </p>
                                    ),
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No medications listed.</p>
                    )}
                    <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                      <p>
                        Admission: {form.admissionDate ? new Date(form.admissionDate).toLocaleDateString() : "N/A"} |
                        Discharge: {form.dischargeDate ? new Date(form.dischargeDate).toLocaleDateString() : "N/A"}
                      </p>
                      <p>
                        Pharmacist: {form.pharmacist || "N/A"} | List Prepared:{" "}
                        {form.dateListPrepared ? new Date(form.dateListPrepared).toLocaleDateString() : "N/A"}
                      </p>
                      {form.templateType === "before-admission" && (
                        <>
                          <p>
                            Concession: {form.concession || "N/A"} | Health Fund: {form.healthFund || "N/A"}
                          </p>
                          <p>Reason for Admission: {form.reasonForAdmission || "N/A"}</p>
                          <p>Relevant Past Medical History: {form.relevantPastMedicalHistory || "N/A"}</p>
                          <p>Community Pharmacist: {form.communityPharmacist || "N/A"}</p>
                          <p>General Practitioner: {form.generalPractitioner || "N/A"}</p>
                          <p>Medication Risks/Comments: {form.medicationRisksComments || "N/A"}</p>
                          <p>Sources of History: {form.sourcesOfHistory || "N/A"}</p>
                          <p>Pharmacist Signature: {form.pharmacistSignature || "N/A"}</p>
                          <p>
                            Date/Time Signed:{" "}
                            {form.dateTimeSigned ? new Date(form.dateTimeSigned).toLocaleString() : "N/A"}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handlePrint(form.name)}>
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                    <Button onClick={() => handleSendToHospital(form.name)}>
                      <Share2 className="h-4 w-4 mr-2" /> Send to Hospital
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
