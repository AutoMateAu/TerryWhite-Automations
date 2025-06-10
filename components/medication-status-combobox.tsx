"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const statusOptions = [
  { value: "Unchanged", label: "Unchanged" },
  { value: "New", label: "New" },
  { value: "Dose increased", label: "Dose increased" },
  { value: "Dose decreased", label: "Dose decreased" },
]

interface MedicationStatusComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MedicationStatusCombobox({
  value,
  onChange,
  placeholder = "Select status...",
}: MedicationStatusComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return statusOptions

    return statusOptions.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search status..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
