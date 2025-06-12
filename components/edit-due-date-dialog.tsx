"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { updateAccountDueDate } from "@/services/accounting-service"
import type { CustomerAccount } from "@/lib/types"

interface EditDueDateDialogProps {
  account: CustomerAccount
  onSuccess: () => void
  onCancel: () => void
}

export function EditDueDateDialog({ account, onSuccess, onCancel }: EditDueDateDialogProps) {
  const initialDate = account.dueDate ? new Date(account.dueDate) : undefined
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "No Date Selected",
        description: "Please select a new due date.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const newDueDateISO = format(date, "yyyy-MM-dd")
      const result = await updateAccountDueDate(account.id, newDueDateISO)

      if (result.success) {
        toast({
          title: "Due Date Updated",
          description: `Payment due date for ${account.patientName} updated to ${format(date, "PPP")}.`,
        })
        onSuccess()
      } else {
        toast({
          title: "Error Updating Due Date",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating due date:", error)
      toast({
        title: "Error Updating Due Date",
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
        <DialogTitle>Edit Payment Due Date</DialogTitle>
        <DialogDescription>
          Set a new payment due date for {account.patientName} (MRN: {account.mrn}).
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">Current Due Date:</p>
          <p className="text-muted-foreground">
            {account.dueDate ? format(new Date(account.dueDate), "PPP") : "Not set (calculated automatically)"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">New Due Date:</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !date}>
          {isSubmitting ? "Saving..." : "Save Due Date"}
        </Button>
      </DialogFooter>
    </>
  )
}
