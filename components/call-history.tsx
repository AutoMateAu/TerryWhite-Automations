"use client"

import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getCallHistory } from "@/services/accounting-service"
import type { CallLog, CustomerAccount } from "@/lib/types"
import { Phone, Calendar } from "lucide-react"

interface CallHistoryProps {
  account: CustomerAccount
}

export function CallHistory({ account }: CallHistoryProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCallHistory() {
      try {
        const history = await getCallHistory(account.id)
        setCallLogs(history)
      } catch (err) {
        console.error("Error loading call history:", err)
        setError("Failed to load call history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadCallHistory()
  }, [account.id])

  const formatCallDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Sydney",
      })}`
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Sydney",
      })}`
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Sydney",
      })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call History
        </DialogTitle>
        <DialogDescription>
          Phone call records for {account.patientName} ({account.phone || "Phone not available"})
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        {isLoading ? (
          <div className="text-center py-8">Loading call history...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : callLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No call records found.</p>
            <p className="text-sm">Call logs will appear here after you record phone calls.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {callLogs.length} call{callLogs.length !== 1 ? "s" : ""} recorded
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Logged By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formatCallDate(call.callDate)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(call.callDate).toLocaleDateString("en-AU", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            timeZone: "Australia/Sydney",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm">{call.comments}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {call.createdBy || "Staff"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
