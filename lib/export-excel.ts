import * as XLSX from "xlsx"
import type { Medication } from "./types"

export function exportMedicationsToExcel(
  medications: Medication[],
  patientName: string,
  templateType: "before-admission" | "after-admission" | "new" | "hospital-specific",
) {
  let data: any[] = []
  let headers: string[] = []

  if (templateType === "before-admission") {
    headers = [
      "Medication",
      "Dosage and Frequency",
      "Home med or New",
      "Currently Charted?",
      "Comments/Actions",
      "Dr to sign when action completed",
    ]
    data = medications.map((med) => ({
      Medication: med.name,
      "Dosage and Frequency": med.dosageFrequency,
      "Home med or New": med.homeNewStatus,
      "Currently Charted?": med.chartedStatus,
      "Comments/Actions": med.commentsActions,
      "Dr to sign when action completed": med.drSignActionCompleted,
    }))
  } else {
    // Default headers for other templates
    headers = ["Medication", "7AM", "8AM", "Noon", "2PM", "6PM", "8PM", "10PM", "Status", "Comments"]
    data = medications.map((med) => ({
      Medication: med.name,
      "7AM": med.times?.["7am"],
      "8AM": med.times?.["8am"],
      Noon: med.times?.Noon,
      "2PM": med.times?.["2pm"],
      "6PM": med.times?.["6pm"],
      "8PM": med.times?.["8pm"],
      "10PM": med.times?.["10pm"],
      Status: med.status,
      Comments: med.comments,
    }))
  }

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Medications")

  const fileName = `${patientName.replace(/\s/g, "_")}_Medications_${templateType}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
