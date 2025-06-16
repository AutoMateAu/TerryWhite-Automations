"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { uploadPatientDocument } from "@/services/accounting-service"
import type { PatientDocument } from "@/lib/types"
import { FileText, Download } from "lucide-react"

interface DocumentUploadTabProps {
  patientId: string
  existingDocuments: PatientDocument[]
  onDocumentUploadSuccess: () => void // Callback to re-fetch documents after upload
}

export default function DocumentUploadTab({
  patientId,
  existingDocuments,
  onDocumentUploadSuccess,
}: DocumentUploadTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    } else {
      setSelectedFile(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a document to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadPatientDocument(patientId, selectedFile)

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `${selectedFile.name} has been uploaded.`,
        })
        setSelectedFile(null)
        onDocumentUploadSuccess() // Trigger re-fetch in parent
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "There was an error uploading your document.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle>Uploading Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="document">Upload New Document</Label>
          <Input id="document" type="file" onChange={handleFileChange} />
          {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
        </div>
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
        <p className="text-sm text-muted-foreground">Supported formats: PDF, Word (.doc, .docx), Images (JPG, PNG)</p>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Existing Documents
          </h3>
          {existingDocuments.length === 0 ? (
            <p className="text-muted-foreground">No documents uploaded for this patient yet.</p>
          ) : (
            <ul className="space-y-2">
              {existingDocuments.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center text-sm p-2 border rounded-md bg-gray-50">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.fileName} ({new Date(doc.uploadedAt).toLocaleDateString()})
                  </span>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" /> View
                    </Button>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
