"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { CustomerAccount } from "@/lib/types"
import { generateAccountPDF } from "@/utils/pdf-client"
import { uploadPdfToBlob, sendSms } from "@/services/communication-service"

interface SendPaymentLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  account: CustomerAccount
}

export function SendPaymentLinkDialog({ isOpen, onClose, account }: SendPaymentLinkDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [phoneNumber, setPhoneNumber] = useState(account.phone || "")
  const [message, setMessage] = useState(
    `Hi ${account.patientName},\n\nYour outstanding balance is $${account.totalOwed.toFixed(2)}. ` +
      `Please use this secure link to make a payment: https://demo.paybyweb.nab.com.au/SecureBillPayment/securebill/nab/payTemplate.vm?&bill_name=${encodeURIComponent(account.patientName)}\n\n` +
      `Your discharge summary is attached here: [PDF_LINK_PLACEHOLDER]\n\n` +
      `Thank you,\nYour Pharmacy`,
  )

  const handleSend = async () => {
    if (!phoneNumber) {
      toast({
        title: "Missing Phone Number",
        description: "Please enter a recipient phone number.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        // 1. Generate PDF
        toast({
          title: "Generating PDF...",
          description: "Please wait while the discharge summary is being prepared.",
          duration: 3000,
        })
        const pdfBlob = await generateAccountPDF(
          [account], // Pass the single account in an array
          {
            includeContactInfo: true,
            includeAccountSummary: true,
            includePaymentHistory: true,
            includeCallHistory: true,
            paymentDateRange: undefined,
            callDateRange: undefined,
          },
          "single",
        )

        // 2. Upload PDF to Vercel Blob
        toast({
          title: "Uploading PDF...",
          description: "Uploading discharge summary to secure storage.",
          duration: 3000,
        })
        const pdfFilename = `${account.patientName.replace(/\s/g, "-")}-DischargeSummary.pdf`
        const pdfUrl = await uploadPdfToBlob(pdfBlob, pdfFilename)

        // 3. Replace placeholder and send SMS
        const finalMessage = message.replace("[PDF_LINK_PLACEHOLDER]", pdfUrl)
        toast({
          title: "Sending SMS...",
          description: "Attempting to send the message with payment and PDF links.",
          duration: 3000,
        })
        const smsResult = await sendSms(phoneNumber, finalMessage)

        if (smsResult.success) {
          toast({
            title: "SMS Sent!",
            description: smsResult.message || "Message sent successfully.",
            action: <CheckCircle className="text-green-600" />,
          })
          onClose()
        } else {
          toast({
            title: "SMS Failed",
            description: smsResult.error || "Failed to send message.",
            variant: "destructive",
            action: <XCircle className="text-red-600" />,
          })
        }
      } catch (error: any) {
        console.error("Error in SendPaymentLinkDialog:", error)
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred during the process.",
          variant: "destructive",
          action: <XCircle className="text-red-600" />,
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Payment Link & Discharge</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Phone
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
              placeholder="e.g., +1234567890"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3 min-h-[150px]"
              placeholder="Enter your message here..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
