"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Printer, Share2, FileText, UserCircle, CalendarClock, PlusCircle, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DischargedForm, Hospital as HospitalType } from "@/lib/types"
import { getDischargedForms } from "@/services/accounting-service"
import { useToast } from "@/components/ui/use-toast"

import NewDischargeDrawer from "@/components/new-discharge-drawer"

export default function DischargePage() {
  const [dischargedForms, setDischargedForms] = useState<DischargedForm[]>([])
  const [hospitals, setHospitals] = useState<HospitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeHospitalTab, setActiveHospitalTab] = useState("all")
  const [activeStatusTab, setActiveStatusTab] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const forms = await getDischargedForms()
      setDischargedForms(forms)
      setHospitals([
        { id: "all", name: "All Hospitals", address: null, phone: null, email: null },
        { id: "arcadia-pittwater", name: "Arcadia Pittwater", address: null, phone: null, email: null },
        { id: "esph", name: "ESPH", address: null, phone: null, email: null },
        { id: "manly-waters", name: "Manly Waters", address: null, phone: null, email: null },
        { id: "northern-beaches", name: "Northern Beaches", address: null, phone: null, email: null },
        { id: "other", name: "Other", address: null, phone: null, email: null },
      ])
      setLoading(false)
    }
    fetchInitialData()
  }, [])

  const filteredForms = useMemo(() => {
    return dischargedForms.filter((form) => {
      const matchesHospital = activeHospitalTab === "all" || form.hospital_id === activeHospitalTab
      const matchesStatus =
        activeStatusTab === "all" ||
        (activeStatusTab === "active" && (form.status === "active" || form.status === "draft")) ||
        (activeStatusTab === "archived" && form.status === "archived")
      const matchesSearch =
        !searchTerm ||
        form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.mrn?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesHospital && matchesStatus && matchesSearch
    })
  }, [dischargedForms, activeHospitalTab, activeStatusTab, searchTerm])

  const counts = {
    all: dischargedForms.length,
    active: dischargedForms.filter((f) => f.status === "active" || f.status === "draft").length,
    archived: dischargedForms.filter((f) => f.status === "archived").length,
  }

  const handlePrint = (patientName: string) => alert(`Printing form for ${patientName}... (Not implemented)`)
  const handleSendToHospital = (patientName: string) =>
    alert(`Sending form for ${patientName} to hospital... (Not implemented)`)
  const handleCreateNew = () => setIsDrawerOpen(true)

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center text-lg font-medium text-slate-dark">
        Loading discharge summaries...
      </div>
    )
  }

  return (
    <div className="container mx-auto pt-10 pb-16 font-sans">
      {" "}
      {/* Increased padding, applied font-sans */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        {" "}
        {/* Increased mb, added gap */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search discharges by patient name or MRN..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-violet-highlight focus:border-violet-highlight w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-violet-highlight text-white hover:bg-violet-highlight/90 w-full sm:w-auto"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Create New Discharge
        </Button>
      </div>
      <h1 className="text-4xl font-bold text-slate-dark mb-2">Discharges</h1> {/* Increased font size, adjusted mb */}
      <p className="text-xl font-medium text-gray-500 mb-8">Manage all patient discharge summaries</p>{" "}
      {/* Increased font size, adjusted mb */}
      <Tabs value={activeHospitalTab} onValueChange={setActiveHospitalTab} className="mb-8">
        {" "}
        {/* Increased mb */}
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-transparent p-0 text-muted-foreground border-b border-gray-200">
          {hospitals.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="relative inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-deep-purple data-[state=active]:shadow-none hover:bg-light-pink/20"
            >
              {" "}
              {/* Increased px, py, text-base */}
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full mb-12">
        {" "}
        {/* Increased mb */}
        <TabsList className="flex flex-wrap gap-6">
          {" "}
          {/* Increased gap */}
          {(["all", "active", "archived"] as const).map((status) => (
            <TabsTrigger value={status} asChild key={status}>
              <div
                className={`flex-1 w-full h-[80px] rounded-lg border p-4 cursor-pointer shadow-sm transition-all duration-200
               ${activeStatusTab === status ? "border-violet-highlight ring-1 ring-violet-highlight" : "border-gray-200"} bg-white hover:shadow-md`}
              >
                {" "}
                {/* Increased height, padding */}
                <h3 className="text-sm font-semibold text-slate-dark mb-2 capitalize">{status}</h3> {/* Adjusted mb */}
                <p className="text-xl font-bold text-deep-purple">{counts[status]}</p> {/* Increased font size */}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {filteredForms.length === 0 ? (
        <Card className="text-center py-16 bg-soft-offwhite shadow-lg rounded-xl mt-24">
          {" "}
          {/* Increased py, mt */}
          <CardHeader>
            <FileText className="h-20 w-20 mx-auto text-deep-purple mb-6" /> {/* Increased size, mb */}
            <CardTitle className="text-3xl font-bold text-slate-dark">No Discharge Summaries Yet</CardTitle>{" "}
            {/* Increased font size */}
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xl font-medium text-gray-500">
              Create and send a medication plan from here to see it listed.
            </CardDescription>{" "}
            {/* Increased font size */}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-6 mt-24">
          {" "}
          {/* Increased space-y, mt */}
          {filteredForms.map((form) => (
            <AccordionItem
              value={form.id}
              key={form.id}
              className="border rounded-lg shadow-md bg-soft-offwhite animate-fade-in-up"
            >
              <AccordionTrigger className="p-6 hover:bg-light-pink/30 rounded-t-lg transition-colors duration-300">
                {" "}
                {/* Increased padding */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    {" "}
                    {/* Increased gap */}
                    <UserCircle className="h-6 w-6 text-deep-purple" /> {/* Increased size */}
                    <span className="font-semibold text-lg text-slate-dark">{form.name}</span>{" "}
                    {/* Increased font size */}
                    <span className="text-base text-gray-500">(MRN: {form.mrn})</span> {/* Increased font size */}
                    {form.templateType && (
                      <Badge
                        variant="secondary"
                        className="ml-3 bg-violet-highlight/20 text-deep-purple font-medium text-sm"
                      >
                        {form.templateType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    )}
                    {form.hospitalName && (
                      <Badge variant="outline" className="ml-2 border-deep-purple text-deep-purple font-medium text-sm">
                        {form.hospitalName}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-base text-gray-500">
                    {" "}
                    {/* Increased gap, font size */}
                    <CalendarClock className="h-5 w-5 text-deep-purple" /> {/* Increased size */}
                    <span>Prepared: {new Date(form.dischargeTimestamp).toLocaleString()}</span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-6 border-t border-light-pink/50 bg-white">
                {" "}
                {/* Increased padding */}
                <Card className="border-none shadow-none">
                  <CardHeader className="pb-3">
                    {" "}
                    {/* Adjusted pb */}
                    <CardTitle className="text-2xl font-bold text-slate-dark">
                      Medication Plan for {form.name}
                    </CardTitle>{" "}
                    {/* Increased font size */}
                    <CardDescription className="text-base font-medium text-gray-500">
                      DOB: {form.dob ? new Date(form.dob).toLocaleDateString() : "N/A"} | Allergies:{" "}
                      {form.allergies || "N/A"}
                    </CardDescription>{" "}
                    {/* Increased font size */}
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-lg text-deep-purple mb-3 underline">Medications:</h4>{" "}
                    {/* Increased font size, mb */}
                    {form.medications && form.medications.length > 0 ? (
                      form.medications.map((med: any, index: number) => (
                        <div
                          key={med.id || index}
                          className="mb-4 p-3 border rounded-md text-base bg-soft-offwhite/50 border-light-pink/50"
                        >
                          {" "}
                          {/* Increased mb, padding, font size */}
                          <p className="font-medium text-slate-dark mb-1">
                            <strong>{med.name || "Unnamed Medication"}</strong>
                          </p>
                          {form.templateType === "before-admission" ? (
                            <>
                              <p className="text-gray-600">Dosage/Frequency: {med.dosageFrequency || "N/A"}</p>
                              <p className="text-gray-600">
                                Home/New:{" "}
                                <Badge variant="outline" className="border-deep-purple text-deep-purple">
                                  {med.homeNewStatus || "N/A"}
                                </Badge>
                              </p>
                              <p className="text-gray-600">
                                Charted:{" "}
                                <Badge variant="outline" className="border-deep-purple text-deep-purple">
                                  {med.chartedStatus || "N/A"}
                                </Badge>
                              </p>
                              <p className="text-gray-600">Comments/Actions: {med.commentsActions || "None"}</p>
                              <p className="text-gray-600">Dr Sign: {med.drSignActionCompleted || "N/A"}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-600">
                                Status:{" "}
                                <Badge variant="outline" className="border-deep-purple text-deep-purple">
                                  {med.status || "N/A"}
                                </Badge>
                              </p>
                              <p className="text-gray-600">Comments: {med.comments || "None"}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {" "}
                                {/* Increased gap, mt */}
                                {Object.entries(med.times || {}).map(
                                  ([time, dose]) =>
                                    dose && (
                                      <p key={time} className="text-sm text-gray-600">
                                        {" "}
                                        {/* Adjusted font size */}
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
                      <p className="text-base text-gray-500">No medications listed.</p>
                    )}
                    <div className="mt-6 pt-4 border-t border-light-pink/50 text-sm text-gray-500 space-y-1">
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

                  <CardFooter className="flex justify-end gap-3 pt-6 border-t border-light-pink/50">
                    {" "}
                    {/* Increased gap, pt */}
                    <Button
                      variant="outline"
                      onClick={() => handlePrint(form.name)}
                      className="border-deep-purple text-deep-purple hover:bg-deep-purple/10 px-4 py-2"
                    >
                      {" "}
                      {/* Increased px, py */}
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                    <Button
                      onClick={() => handleSendToHospital(form.name)}
                      className="bg-violet-highlight text-white hover:bg-violet-highlight/90 px-4 py-2"
                    >
                      {" "}
                      {/* Increased px, py */}
                      <Share2 className="h-4 w-4 mr-2" /> Send to Hospital
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <NewDischargeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hospitals={hospitals.filter((h) => h.id !== "all")}
      />
    </div>
  )
}
