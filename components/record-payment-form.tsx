"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { recordPayment } from "@/services/accounting-service"
import { useToast } from "@/components/ui/use-toast"
import type { CustomerAccount } from "@/lib/types"

interface RecordPaymentFormProps {
  account: CustomerAccount
  onSuccess: () => void
  onCancel: () => void
}

export function RecordPaymentForm({ account, onSuccess, onCancel }: RecordPaymentFormProps) {
  const [amount, setAmount] = useState<string>(account.totalOwed.toString())
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "insurance" | "other">("card")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await recordPayment(account.id, Number.parseFloat(amount), paymentMethod, notes)

      if (result.success) {
        toast({
          title: "Payment recorded",
          description: `Successfully recorded payment of $${amount} for ${account.patientName}.`,
        })
        onSuccess()
      } else {
        toast({
          title: "Error recording payment",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error recording payment",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>
          Record a payment for {account.patientName} (MRN: {account.mrn})
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Payment Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={account.totalOwed}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter payment amount"
            required
          />
          <div className="text-sm text-muted-foreground">Outstanding balance: ${account.totalOwed.toFixed(2)}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about this payment"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
