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
import { getDischargedForms, getHospitals } from "@/services/accounting-service" // Import getHospitals
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

import NewDischargeDrawer from "@/components/new-discharge-drawer"

export default function DischargePage() {
  const searchParams = useSearchParams()
  // The initialHospitalTab from searchParams might be a name, not an ID.
  // We'll handle mapping it to an ID after fetching hospitals.
  const initialHospitalNameFromUrl = searchParams.get("hospitalId")

  const [dischargedForms, setDischargedForms] = useState<DischargedForm[]>([])
  const [hospitals, setHospitals] = useState<HospitalType[]>([]) // This will store actual hospital objects
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeHospitalTab, setActiveHospitalTab] = useState("all") // This will store the UUID or "all"
  const [activeStatusTab, setActiveStatusTab] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const fetchedHospitals = await getHospitals()
        // Add "All Hospitals" option
        const allHospitalsOption: HospitalType = {
          id: "all",
          name: "All Hospitals",
          address: null,
          phone: null,
          email: null,
        }
        setHospitals([allHospitalsOption, ...fetchedHospitals])

        // Determine the actual hospital ID to filter by
        let hospitalIdToFilter: string | undefined = undefined
        if (initialHospitalNameFromUrl && initialHospitalNameFromUrl !== "all") {
          // Find the hospital by name (case-insensitive, kebab-case to normal)
          const foundHospital = fetchedHospitals.find(
            (h) => h.name.toLowerCase().replace(/\s/g, "-") === initialHospitalNameFromUrl.toLowerCase(),
          )
          if (foundHospital) {
            hospitalIdToFilter = foundHospital.id
            setActiveHospitalTab(foundHospital.id) // Set the active tab to the UUID
          } else {
            setActiveHospitalTab("all") // If not found, default to all
          }
        } else {
          setActiveHospitalTab("all") // Default to all if no param or param is "all"
        }

        // Fetch forms using the determined hospitalIdToFilter
        const forms = await getDischargedForms(hospitalIdToFilter)
        setDischargedForms(forms)
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
        toast({
          title: "Error",
          description: "Failed to load discharge summaries or hospitals.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [initialHospitalNameFromUrl, toast]) // Depend on initialHospitalNameFromUrl and toast

  // When activeHospitalTab changes (e.g., user clicks a tab), refetch forms
  useEffect(() => {
    const refetchForms = async () => {
      setLoading(true)
      try {
        const forms = await getDischargedForms(activeHospitalTab === "all" ? undefined : activeHospitalTab)
        setDischargedForms(forms)
      } catch (error) {
        console.error("Failed to refetch forms:", error)
        toast({
          title: "Error",
          description: "Failed to load discharge summaries for the selected hospital.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    // Only refetch if activeHospitalTab has changed from its initial load value
    // or if it's explicitly changed by user interaction.
    // This prevents double-fetching on initial render.
    if (!loading) {
      // Only refetch if not already loading from initial data fetch
      refetchForms()
    }
  }, [activeHospitalTab]) // Re-run effect when activeHospitalTab changes

  const filteredForms = useMemo(() => {
    return dischargedForms.filter((form) => {
      // The form.hospital_id is already a UUID from the DB
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

  const handlePrint = (patientName: string) =>
    toast({ title: "Printing", description: `Printing form for ${patientName}... (Not implemented)` })
  const handleSendToHospital = (patientName: string) =>
    toast({ title: "Sending", description: `Sending form for ${patientName} to hospital... (Not implemented)` })
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
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search discharges by patient name or MRN..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-purple-600 focus:border-purple-600 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCreateNew}
          className="border-purple-600 text-purple-600 hover:bg-purple-50 w-full sm:w-auto"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Create New Discharge
        </Button>
      </div>
      <h1 className="text-4xl font-bold text-slate-dark mb-2">Discharges</h1>
      <p className="text-xl font-medium text-gray-500 mb-8">Manage all patient discharge summaries</p>
      <Tabs value={activeHospitalTab} onValueChange={setActiveHospitalTab} className="mb-8">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-transparent p-0 text-muted-foreground">
          {hospitals.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id} // Use the actual UUID or "all"
              className="relative inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-purple-600 data-[state=active]:bg-purple-50 data-[state=active]:border-b-2 data-[state=active]:border-purple-400 hover:bg-light-pink/20"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="w-full mb-12">
        <TabsList className="flex flex-wrap gap-6">
          {(["all", "active", "archived"] as const).map((status) => (
            <TabsTrigger value={status} asChild key={status}>
              <div
                className={cn(
                  "flex-1 w-full h-[80px] rounded-lg border p-4 cursor-pointer shadow-sm transition-all duration-200",
                  activeStatusTab === status
                    ? status === "all"
                      ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                      : "border-purple-600 ring-1 ring-purple-600 bg-white hover:shadow-md"
                    : "border-gray-200 bg-white hover:shadow-md",
                )}
              >
                <h3
                  className={cn(
                    "text-sm font-semibold mb-2 capitalize",
                    activeStatusTab === status && status === "all" ? "text-purple-600" : "text-slate-dark",
                  )}
                >
                  {status}
                </h3>
                <p
                  className={cn(
                    "text-xl font-bold",
                    activeStatusTab === status && status === "all" ? "text-purple-600" : "text-purple-600",
                  )}
                >
                  {counts[status]}
                </p>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {filteredForms.length === 0 ? (
        <Card className="text-center py-16 bg-soft-offwhite shadow-lg rounded-xl mt-24">
          <CardHeader>
            <div className="mx-auto p-4 bg-purple-50 rounded-full mb-6">
              <FileText className="h-20 w-20 text-purple-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-dark">No Discharge Summaries Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xl font-medium text-gray-500">
              Create and send a medication plan from here to see it listed.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-6 mt-24">
          {filteredForms.map((form) => (
            <AccordionItem
              value={form.id}
              key={form.id}
              className="border rounded-lg shadow-md bg-soft-offwhite animate-fade-in-up"
            >
              <AccordionTrigger className="p-6 hover:bg-light-pink/30 rounded-t-lg transition-colors duration-300">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <UserCircle className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-lg text-slate-dark">{form.name}</span>
                    <span className="text-base text-gray-500">(MRN: {form.mrn})</span>
                    {form.templateType && (
                      <Badge variant="secondary" className="ml-3 bg-purple-600/20 text-purple-600 font-medium text-sm">
                        {form.templateType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    )}
                    {form.hospitalName && (
                      <Badge variant="outline" className="ml-2 border-purple-600 text-purple-600 font-medium text-sm">
                        {form.hospitalName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-base text-gray-500">
                    <CalendarClock className="h-5 w-5 text-purple-600" />
                    <span>Prepared: {new Date(form.dischargeTimestamp).toLocaleString()}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 border-t border-light-pink/50 bg-white">
                <Card className="border-none shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl font-bold text-slate-dark">
                      Medication Plan for {form.name}
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-gray-500">
                      DOB: {form.dob ? new Date(form.dob).toLocaleDateString() : "N/A"} | Allergies:{" "}
                      {form.allergies || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-lg text-purple-600 mb-3 underline">Medications:</h4>
                    {form.medications && form.medications.length > 0 ? (
                      form.medications.map((med: any, index: number) => (
                        <div
                          key={med.id || index}
                          className="mb-4 p-3 border rounded-md text-base bg-soft-offwhite/50 border-light-pink/50"
                        >
                          <p className="font-medium text-slate-dark mb-1">
                            <strong>{med.name || "Unnamed Medication"}</strong>
                          </p>
                          {form.templateType === "before-admission" ? (
                            <>
                              <p className="text-gray-600">Dosage/Frequency: {med.dosageFrequency || "N/A"}</p>
                              <p className="text-gray-600">
                                Home/New:{" "}
                                <Badge variant="outline" className="border-purple-600 text-purple-600">
                                  {med.homeNewStatus || "N/A"}
                                </Badge>
                              </p>
                              <p className="text-gray-600">
                                Charted:{" "}
                                <Badge variant="outline" className="border-purple-600 text-purple-600">
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
                                <Badge variant="outline" className="border-purple-600 text-purple-600">
                                  {med.status || "N/A"}
                                </Badge>
                              </p>
                              <p className="text-gray-600">Comments: {med.comments || "None"}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                {Object.entries(med.times || {}).map(
                                  ([time, dose]) =>
                                    dose && (
                                      <p key={time} className="text-sm text-gray-600">
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
                    <Button
                      variant="outline"
                      onClick={() => handlePrint(form.name)}
                      className="border-purple-600 text-purple-600 hover:bg-purple-600/10 px-4 py-2"
                    >
                      <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                    <Button
                      onClick={() => handleSendToHospital(form.name)}
                      className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2"
                    >
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
