import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MedicationPlanForm } from "@/components/medication-plan-form"
import { getDischargedForms } from "@/services/accounting-service"
import { format } from "date-fns"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog"
import { getUserSessionAndProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DischargePage() {
  const { session, profile, error } = await getUserSessionAndProfile()

  if (error || !session) {
    redirect("/login")
  }

  const { forms, error: formsError } = await getDischargedForms()

  if (formsError) {
    return <div className="p-4 text-red-500">Error loading discharged forms: {formsError}</div>
  }

  const isDoctor = profile?.role === "doctor"
  const isNurse = profile?.role === "nurse"
  const isAdmin = profile?.role === "admin"

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Discharge Summaries</h1>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin || isDoctor ? <MedicationPlanForm /> : null}
          <BulkPDFExportDialog forms={forms || []} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Discharged Patient Forms</CardTitle>
          <CardDescription>
            A list of all discharged patient forms, including their details and medication plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Discharge Date</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Medications</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms?.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.patient_name}</TableCell>
                  <TableCell>{form.hospitals?.name || "N/A"}</TableCell>
                  <TableCell>{form.discharge_date ? format(new Date(form.discharge_date), "PPP") : "N/A"}</TableCell>
                  <TableCell>{form.diagnosis}</TableCell>
                  <TableCell>
                    {form.medications && form.medications.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {form.medications.map((med, index) => (
                          <li key={index}>
                            {med.name} ({med.dosage})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No medications"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(isAdmin || isDoctor) && <MedicationPlanForm initialData={form} />}
                      <PDFExportDialog form={form} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
