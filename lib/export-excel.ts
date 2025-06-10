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

  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Medications List")

  // Generate workbook as ArrayBuffer (browser-safe)
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

  // Create a Blob and download link
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const fileName = `${patientName.replace(/\s+/g, "_") || "Patient"}_Medications_List.xlsx`

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
