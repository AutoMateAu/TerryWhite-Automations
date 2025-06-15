"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  getPatientById,
  getCustomerAccountByPatientId,
  getDischargeFormsByPatientId,
  getPaymentHistory,
  getCallHistory,
} from "@/services/accounting-service"
import type { PatientProfile, CustomerAccount, DischargedPatient, Payment, CallLog } from "@/lib/types"
import { User, CalendarDays, MapPin, FileIcon as FileMedical, Pill, Phone, History, PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PaymentHistory } from "@/components/payment-history"
import { CallHistory } from "@/components/call-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const { toast } = useToast()

  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [account, setAccount] = useState<CustomerAccount | null>(null)
  const [dischargeSummaries, setDischargeSummaries] = useState<DischargedPatient[]>([])
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [callHistory, setCallHistory] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const fetchedPatient = await getPatientById(patientId)
        setPatient(fetchedPatient)

        if (fetchedPatient) {
          const fetchedAccount = await getCustomerAccountByPatientId(fetchedPatient.id)
          setAccount(fetchedAccount)

          const fetchedDischargeSummaries = await getDischargeFormsByPatientId(fetchedPatient.id)
          setDischargeSummaries(fetchedDischargeSummaries)

          if (fetchedAccount) {
            const fetchedPaymentHistory = await getPaymentHistory(fetchedAccount.id)
            setPaymentHistory(fetchedPaymentHistory)

            const fetchedCallHistory = await getCallHistory(fetchedAccount.id)
            setCallHistory(fetchedCallHistory)
          }
        } else {
          toast({
            title: "Patient Not Found",
            description: "The requested patient could not be found.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching patient details:", error)
        toast({
          title: "Error",
          description: "Failed to load patient details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [patientId, toast])

  const getStatusColor = (status: CustomerAccount["status"]) => {
    switch (status) {
      case "current":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-3/4 mb-8" />
        <div className="flex space-x-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-8">Patient Details</h1>
        <p>Patient not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Patient Details: {patient.name}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Patient Details</TabsTrigger>
          <TabsTrigger value="discharge">Discharge Summaries</TabsTrigger>
          <TabsTrigger value="medications">Previous Medications</TabsTrigger>
          <TabsTrigger value="accounting">Accounting Summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Name:</strong> {patient.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileMedical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>MRN:</strong> {patient.mrn}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharge" className="mt-6">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle>Discharge Summaries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dischargeSummaries.length === 0 ? (
                <p className="text-muted-foreground">No discharge summaries found for this patient.</p>
              ) : (
                dischargeSummaries.map((form) => (
                  <div key={form.id} className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg mb-2">
                      Summary from {new Date(form.dischargeTimestamp).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-muted-foreground">Template Type: {form.templateType}</p>
                    {form.hospitalName && (
                      <p className="text-sm text-muted-foreground">Hospital: {form.hospitalName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Pharmacist: {form.pharmacist || "N/A"}</p>
                    <h4 className="font-medium mt-3 mb-1">Medications:</h4>
                    {form.medications.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No medications listed in this summary.</p>
                    ) : (
                      <ul className="list-disc list-inside text-sm">
                        {form.medications.map((med: any, idx: number) => (
                          <li key={idx}>
                            <strong>{med.name}</strong>: {med.dosageFrequency || med.status || "N/A"}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={`/discharge?formId=${form.id}`} passHref>
                      <Button variant="link" className="p-0 h-auto mt-2">
                        View Full Summary
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle>Previous Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dischargeSummaries.length === 0 ? (
                <p className="text-muted-foreground">No previous medication records found.</p>
              ) : (
                dischargeSummaries.map((form) => (
                  <div key={form.id} className="border p-4 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-lg mb-2">
                      Medications from {new Date(form.dischargeTimestamp).toLocaleDateString()}
                    </h3>
                    {form.medications.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No medications listed in this summary.</p>
                    ) : (
                      <ul className="list-disc list-inside text-sm">
                        {form.medications.map((med: any, idx: number) => (
                          <li key={idx}>
                            <strong>{med.name}</strong>: {med.dosageFrequency || med.status || "N/A"}
                            {med.comments && <span className="text-muted-foreground ml-2">({med.comments})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle>Accounting Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {account ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-medium text-gray-700">Amount Owed:</p>
                      <p className="text-3xl font-bold text-gray-900">${account.totalOwed.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">Status:</p>
                      <Badge className={`text-lg px-3 py-1 ${getStatusColor(account.status)}`}>
                        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">Last Payment:</p>
                      {account.lastPaymentDate ? (
                        <div className="text-xl font-semibold text-gray-900">
                          {new Date(account.lastPaymentDate).toLocaleDateString()} ($
                          {account.lastPaymentAmount?.toFixed(2)})
                        </div>
                      ) : (
                        <span className="text-xl text-muted-foreground">No payments recorded</span>
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">Payment Due:</p>
                      <span className="text-xl font-semibold text-blue-600">
                        {account.dueDate ? new Date(account.dueDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                      <History className="h-5 w-5" /> Payment History
                    </h3>
                    <PaymentHistory account={account} />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
                      <PhoneCall className="h-5 w-5" /> Call History
                    </h3>
                    <CallHistory account={account} />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No accounting information found for this patient.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
