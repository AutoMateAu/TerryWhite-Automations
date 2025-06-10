import * as XLSX from "xlsx"
import type { Medication } from "./types"

export function exportMedicationsToExcel(medications: Medication[], patientName: string) {
  if (!medications || medications.length === 0) {
    console.warn("No medications to export.")
    return
  }

  const timeSlots = ["7am", "8am", "Noon", "2pm", "6pm", "8pm", "10pm"]

  // Prepare data for the worksheet
  const data = medications.map((med) => {
    const row: { [key: string]: string } = {
      Medication: med.name,
    }
    timeSlots.forEach((slot) => {
      row[slot.toUpperCase()] = med.times[slot as keyof Medication["times"]] || ""
    })
    row["Status"] = med.status
    row["Comments"] = med.comments
    return row
  })

  // Create a worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Create a workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Medications List")

  // Generate file name
  const fileName = `${patientName.replace(/\s+/g, "_")}_Medications_List.xlsx`

  // Write and download the file
  XLSX.writeFile(wb, fileName)
}
