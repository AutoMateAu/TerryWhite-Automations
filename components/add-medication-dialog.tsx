import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function AddMedicationDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
          <Plus className="mr-2 h-4 w-4" /> Add New Drug
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
          <DialogDescription>Add a new medication to the system.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dosage" className="text-right">
              Dosage
            </Label>
            <Input id="dosage" value="" className="col-span-3" />
          </div>
        </div>
        {/* <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}
