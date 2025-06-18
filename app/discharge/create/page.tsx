"use client"

import { useSearchParams, useRouter } from "next/navigation"
import MedicationPlanForm from "@/components/medication-plan-form"
import type { PatientFormData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CreateDischargePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const templateTypeParam = searchParams.get("templateType")
  const hospitalNameParam = searchParams.get("hospitalName")
  const patientTypeParam = searchParams.get("patientType")
  const patientNameParam = searchParams.get("patientName")
  const dobParam = searchParams.get("dob")
  const mrnParam = searchParams.get("mrn")
  // Add more params as needed for existing patient data

  // Map the simplified templateType from drawer to MedicationPlanForm's expected types
  const medicationFormTemplateType: "before-admission" | "after-admission" | "new" | "hospital-specific" =
    templateTypeParam === "admission"
      ? "before-admission"
      : templateTypeParam === "discharge"
        ? "after-admission"
        : "new" // Default or fallback

  // Construct initial patient data based on patientType
  const initialPatientData: Partial<PatientFormData> = {
    name: patientTypeParam === "existing" ? patientNameParam || "" : "", // For existing, use search term as name
    dob: patientTypeParam === "existing" ? dobParam || "" : "",
    mrn: patientTypeParam === "existing" ? mrnParam || "" : "",
    // For new patient, these fields will be empty and filled directly in the form
  }

  // Handle cases where essential parameters are missing
  if (!templateTypeParam || !hospitalNameParam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 animate-gradient-shift bg-[length:200%_200%] p-4">
        <div className="text-center bg-white/80 p-8 rounded-xl shadow-lg border border-white/30">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Missing Information</h2>
          <p className="text-gray-600 mb-6">Please go back and select a discharge type and hospital.</p>
          <Button
            onClick={() => router.push("/discharge")}
            className="bg-violet-highlight text-white hover:bg-violet-highlight/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Discharges
          </Button>
        </div>
      </div>
    )
  }

  return (
    <MedicationPlanForm
      templateType={medicationFormTemplateType}
      hospitalName={hospitalNameParam}
      initialPatientData={initialPatientData}
      onBack={() => router.push("/discharge")} // Go back to the main discharge summaries page
    />
  )
}
