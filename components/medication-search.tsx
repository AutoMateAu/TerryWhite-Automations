"use client"

import { useState, useEffect, useRef } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Import the medication list
import { medications } from "@/lib/medications" // This line imports the full list

interface MedicationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MedicationSearch({ value, onChange, placeholder = "Search medications..." }: MedicationSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMedications, setFilteredMedications] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // When a search query is entered, filter the *entire* medications list
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      const filtered = medications.filter((med) => med.toLowerCase().includes(lowerCaseQuery)).slice(0, 100) // Display up to 100 matching results for performance
      setFilteredMedications(filtered)
    } else {
      // When the dropdown is opened without a search query, show the first 100 medications
      setFilteredMedications(medications.slice(0, 100))
    }
  }, [searchQuery, open]) // Re-filter when 'open' changes to update initial list if needed

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ zIndex: 1000 }}>
        {" "}
        {/* Ensure popover is on top */}
        <Command>
          <CommandInput
            placeholder="Type to search medications..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            ref={inputRef}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No medication found for "{searchQuery}".</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredMedications.map((med) => (
                <CommandItem
                  key={med}
                  value={med}
                  onSelect={() => {
                    onChange(med)
                    setOpen(false)
                    setSearchQuery("") // Clear search query after selection
                  }}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === med ? "opacity-100" : "opacity-0")} />
                  {med}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
