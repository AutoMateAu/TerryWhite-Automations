"use client"

import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getPaymentHistory } from "@/services/accounting-service"
import type { PaymentRecord, CustomerAccount } from "@/lib/types"

interface PaymentHistoryProps {
  account: CustomerAccount
}

export function PaymentHistory({ account }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPaymentHistory() {
      try {
        const paymentHistory = await getPaymentHistory(account.id)
        setPayments(paymentHistory)
      } catch (err) {
        console.error("Error loading payment history:", err)
        setError("Failed to load payment history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPaymentHistory()
  }, [account.id])

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Cash
          </Badge>
        )
      case "card":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Card
          </Badge>
        )
      case "insurance":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Insurance
          </Badge>
        )
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Payment History</DialogTitle>
        <DialogDescription>
          Payment records for {account.patientName} (MRN: {account.mrn})
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        {isLoading ? (
          <div className="text-center py-8">Loading payment history...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No payment records found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  )
}
