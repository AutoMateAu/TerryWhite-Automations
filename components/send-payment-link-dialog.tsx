"use client"

import { useState } from "react" // Removed useTransition as it's no longer needed for immediate navigation
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink } from "lucide-react" // Changed Loader2, CheckCircle, XCircle to ExternalLink
import { useToast } from "@/components/ui/use-toast"
import type { CustomerAccount } from "@/lib/types"
// Removed imports for generateAccountPDF, uploadPdfToBlob, sendSms as they are not used for this demo

interface SendPaymentLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  account: CustomerAccount
}

export function SendPaymentLinkDialog({ isOpen, onClose, account }: SendPaymentLinkDialogProps) {
  const { toast } = useToast()
  // Removed isPending state as there's no async operation
  const [phoneNumber, setPhoneNumber] = useState(account.phone || "")
  const [message, setMessage] = useState(
    `Hi ${account.patientName},\n\nYour outstanding balance is $${account.totalOwed.toFixed(2)}. ` +
      `Please use this secure link to make a payment: https://demo.paybyweb.nab.com.au/SecureBillPayment/securebill/nab/payTemplate.vm?&bill_name=${encodeURIComponent(account.patientName)}\n\n` +
      `Your discharge summary is attached here: [PDF_LINK_PLACEHOLDER]\n\n` +
      `Thank you,\nYour Pharmacy`,
  )

  const handleOpenPaymentLink = () => {
    const paymentLink = `https://demo.paybyweb.nab.com.au/SecureBillPayment/securebill/nab/payTemplate.vm?&bill_name=${encodeURIComponent(account.patientName)}`
    window.open(paymentLink, "_blank") // Open in a new tab
    toast({
      title: "Opening Payment Link",
      description: "The example payment link has been opened in a new tab.",
    })
    onClose() // Close the dialog after opening the link
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Demonstrate Payment Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-500">
            This action will open an example payment link in a new browser tab for demonstration purposes. No SMS will
            be sent, and no PDF will be generated or uploaded.
          </p>
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
              disabled // Disable input as it's not used for this demo
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
              disabled // Disable input as it's not used for this demo
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleOpenPaymentLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Demo Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
