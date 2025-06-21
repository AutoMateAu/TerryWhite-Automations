"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Medication } from "@/lib/types"

interface MedicationTableProps {
  medications: Medication[]
}

export function MedicationTable({ medications }: MedicationTableProps) {
  if (medications.length === 0) {
    return <p className="text-muted-foreground">No medications listed.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Drug</TableHead>
            <TableHead className="min-w-[150px]">Directions</TableHead>
            <TableHead className="min-w-[80px]">Pack</TableHead>
            <TableHead className="min-w-[120px]">Start Date</TableHead>
            <TableHead className="min-w-[120px]">End Date</TableHead>
            <TableHead className="min-w-[120px]">Frequency</TableHead>
            <TableHead className="min-w-[100px]">Category</TableHead>
            <TableHead className="min-w-[150px]">Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((med) => (
            <TableRow key={med.id} className="border-l-4 border-purple-600">
              <TableCell className="font-medium break-words">{med.name}</TableCell>
              <TableCell className="break-words">{med.directions || "N/A"}</TableCell>
              <TableCell>{med.isPacked ? "Yes" : "No"}</TableCell>
              <TableCell>{med.startDate ? new Date(med.startDate).toLocaleDateString() : "N/A"}</TableCell>
              <TableCell>{med.endDate ? new Date(med.endDate).toLocaleDateString() : "N/A"}</TableCell>
              <TableCell className="break-words">{med.frequency || "N/A"}</TableCell>
              <TableCell className="break-words">{med.category || "N/A"}</TableCell>
              <TableCell className="break-words">{med.note || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
