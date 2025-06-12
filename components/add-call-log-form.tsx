"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { addCallLog } from "@/services/accounting-service"
import { useToast } from "@/components/ui/use-toast"
import type { CustomerAccount } from "@/lib/types"
import { Phone } from "lucide-react"

interface AddCallLogFormProps {
  account: CustomerAccount
  onSuccess: () => void
  onCancel: () => void
}

export function AddCallLogForm({ account, onSuccess, onCancel }: AddCallLogFormProps) {
  const [comments, setComments] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comments.trim()) {
      toast({
        title: "Comments required",
        description: "Please add comments about the call.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addCallLog(account.id, comments.trim())

      if (result.success) {
        toast({
          title: "Call logged",
          description: `Call to ${account.patientName} has been recorded.`,
        })
        onSuccess()
      } else {
        toast({
          title: "Error logging call",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error logging call:", error)
      toast({
        title: "Error logging call",
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
        <DialogTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Log Phone Call
        </DialogTitle>
        <DialogDescription>
          Record a phone call to {account.patientName} ({account.phone || "Phone not available"})
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="callTime">Call Date & Time</Label>
          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {new Date().toLocaleString("en-AU", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Australia/Sydney",
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Call Notes *</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter details about the call (e.g., discussed payment, left voicemail, scheduled callback, etc.)"
            rows={4}
            required
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging Call..." : "Log Call"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
