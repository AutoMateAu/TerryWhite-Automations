"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Hospital, FileText, ArrowRight } from "lucide-react"
import MedicationPlanForm from "@/components/medication-plan-form" // Import the renamed component

// Mock data for hospitals and template types
const hospitalTemplates = [
  { id: "hosp-1", name: "St. Jude's Hospital" },
  { id: "hosp-2", name: "Mercy General Hospital" },
  { id: "hosp-3", name: "City Medical Center" },
]

export default function TemplateSelectionPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<{
    type: "before-admission" | "after-admission" | "new" | "hospital-specific" | null
    hospitalName?: string
  } | null>(null)

  const handleSelectTemplate = (
    type: "before-admission" | "after-admission" | "new" | "hospital-specific",
    hospitalName?: string,
  ) => {
    setSelectedTemplate({ type, hospitalName })
  }

  const handleBackToSelection = () => {
    setSelectedTemplate(null)
  }

  if (selectedTemplate) {
    return (
      <MedicationPlanForm
        templateType={selectedTemplate.type!}
        hospitalName={selectedTemplate.hospitalName}
        onBack={handleBackToSelection}
      />
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 animate-gradient-shift bg-[length:200%_200%]">
      <Card className="max-w-6xl mx-auto rounded-3xl shadow-2xl backdrop-blur-lg bg-white/80 border border-white/30 animate-fade-in-up">
        <CardHeader className="pb-4 border-b border-white/20 bg-gradient-to-r from-gray-100/50 to-blue-100/50 rounded-t-3xl">
          <CardTitle className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
            Select a Medication Plan Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Main Template Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              onClick={() => handleSelectTemplate("before-admission")}
              className="h-auto py-6 text-lg font-semibold rounded-xl
                         bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700
                         hover:from-blue-100 hover:to-blue-200
                         shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]
                         flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Medication Plan Before Admission</span>
            </Button>
            <Button
              onClick={() => handleSelectTemplate("after-admission")}
              className="h-auto py-6 text-lg font-semibold rounded-xl
                         bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700
                         hover:from-indigo-100 hover:to-indigo-200
                         shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]
                         flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Medication Plan After Admission</span>
            </Button>
          </div>

          {/* Hospital-Specific Templates */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Hospital-Specific Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospitalTemplates.map((hospital) => (
                <Button
                  key={hospital.id}
                  onClick={() => handleSelectTemplate("hospital-specific", hospital.name)}
                  className="h-auto py-4 text-base font-medium rounded-lg
                             bg-gradient-to-r from-green-50 to-green-100 text-green-700
                             hover:from-green-100 hover:to-green-200
                             shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-[1.01]
                             flex items-center justify-center space-x-2"
                >
                  <Hospital className="h-5 w-5" />
                  <span>{hospital.name} Template</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>
          </div>

          {/* Create New Template */}
          <div className="pt-4 border-t border-white/20">
            <Button
              onClick={() => handleSelectTemplate("new")}
              className="w-full h-auto py-6 text-lg font-semibold rounded-xl
                         bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700
                         hover:from-slate-100 hover:to-slate-200
                         shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02]
                         flex flex-col items-center justify-center space-y-2"
            >
              <PlusCircle className="h-8 w-8 mb-2" />
              <span>Create New Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
