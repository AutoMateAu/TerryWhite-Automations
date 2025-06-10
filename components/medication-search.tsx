"use client"

import { useState, useEffect, useRef } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // For client-side Supabase
import type { MedicationWithComment } from "@/lib/types" // Import the new type

// Update the props interface
interface MedicationSearchProps {
  value: string // This will still be the medication name
  onChange: (medication: MedicationWithComment | null) => void // Pass the full object or null
  placeholder?: string
}

// Function to sort medications by relevance
function sortMedicationsByRelevance(
  medications: MedicationWithComment[],
  searchQuery: string,
): MedicationWithComment[] {
  if (!searchQuery) return medications

  const query = searchQuery.toLowerCase().trim()

  return medications.sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()

    // Priority 1: Exact match (highest priority)
    const exactMatchA = nameA === query
    const exactMatchB = nameB === query
    if (exactMatchA && !exactMatchB) return -1
    if (!exactMatchA && exactMatchB) return 1

    // Priority 2: Starts with the search query
    const startsWithA = nameA.startsWith(query)
    const startsWithB = nameB.startsWith(query)
    if (startsWithA && !startsWithB) return -1
    if (!startsWithA && startsWithB) return 1

    // Priority 3: Starts with search query after a space or special character
    const wordStartA = nameA.includes(` ${query}`) || nameA.includes(`-${query}`) || nameA.includes(`/${query}`)
    const wordStartB = nameB.includes(` ${query}`) || nameB.includes(`-${query}`) || nameB.includes(`/${query}`)
    if (wordStartA && !wordStartB) return -1
    if (!wordStartA && wordStartB) return 1

    // Priority 4: Contains the search query (position matters - earlier is better)
    const indexA = nameA.indexOf(query)
    const indexB = nameB.indexOf(query)
    if (indexA !== indexB) return indexA - indexB

    // Priority 5: Alphabetical order for same relevance
    return nameA.localeCompare(nameB)
  })
}

// Update the component function signature
export function MedicationSearch({ value, onChange, placeholder = "Search medications..." }: MedicationSearchProps) {
  const supabase = createClientComponentClient()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchedMedications, setFetchedMedications] = useState<MedicationWithComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 1) {
        // Start searching after 2 characters
        setIsLoading(true)

        // Fetch more results to allow for better sorting
        const { data, error } = await supabase
          .from("medications_master")
          .select("id, name, comment")
          .ilike("name", `%${searchQuery}%`) // Case-insensitive search
          .limit(100) // Increased limit to get more results for better sorting

        if (error) {
          console.error("Error fetching medications:", error)
          setFetchedMedications([])
        } else {
          // Sort the results by relevance before setting state
          const sortedMedications = sortMedicationsByRelevance(data || [], searchQuery)
          // Limit to top 50 results after sorting
          setFetchedMedications(sortedMedications.slice(0, 50))
        }
        setIsLoading(false)
      } else if (searchQuery.length === 0 && open) {
        // Fetch initial list if popover is open and no query
        setIsLoading(true)
        const { data, error } = await supabase
          .from("medications_master")
          .select("id, name, comment")
          .order("name", { ascending: true }) // Order alphabetically for initial list
          .limit(50) // Show some initial items

        if (error) {
          console.error("Error fetching initial medications:", error)
          setFetchedMedications([])
        } else {
          setFetchedMedications(data || [])
        }
        setIsLoading(false)
      } else {
        setFetchedMedications([]) // Clear if search query is too short
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, supabase, open])

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setSearchQuery("") // Clear search when popover closes
        }
      }}
    >
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
      <PopoverContent className="w-full p-0" align="start" style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter={false}>
          {" "}
          {/* We handle filtering in useEffect */}
          <CommandInput
            placeholder="Type to search medications..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            ref={inputRef}
            className="h-9"
          />
          <CommandList>
            {isLoading && (
              <div className="p-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            )}
            {!isLoading && searchQuery.length > 1 && fetchedMedications.length === 0 && (
              <CommandEmpty>No medication found for "{searchQuery}".</CommandEmpty>
            )}
            {!isLoading && searchQuery.length === 0 && fetchedMedications.length === 0 && open && (
              <CommandEmpty>Type to search medications.</CommandEmpty>
            )}
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {fetchedMedications.map((med, index) => {
                // Add visual indicators for different match types when searching
                const query = searchQuery.toLowerCase()
                const name = med.name.toLowerCase()
                let matchType = ""

                if (searchQuery.length > 1) {
                  if (name === query) {
                    matchType = "exact"
                  } else if (name.startsWith(query)) {
                    matchType = "starts"
                  } else if (name.includes(` ${query}`) || name.includes(`-${query}`) || name.includes(`/${query}`)) {
                    matchType = "word"
                  } else {
                    matchType = "contains"
                  }
                }

                return (
                  <CommandItem
                    key={med.id}
                    value={med.name} // CommandItem still uses name for its internal value/filtering if enabled
                    onSelect={() => {
                      onChange(med) // Pass the full medication object
                      setOpen(false)
                      setSearchQuery("") // Clear search query after selection
                    }}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === med.name ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {/* Highlight the medication name based on match type */}
                        <span
                          className={cn(
                            "font-medium",
                            matchType === "exact" && "text-blue-600 dark:text-blue-400",
                            matchType === "starts" && "text-green-600 dark:text-green-400",
                          )}
                        >
                          {med.name}
                        </span>
                        {/* Show match type indicator for debugging/clarity */}
                        {searchQuery.length > 1 && (
                          <span
                            className={cn(
                              "text-xs px-1 py-0.5 rounded",
                              matchType === "exact" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                              matchType === "starts" &&
                                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                              matchType === "word" &&
                                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                              matchType === "contains" &&
                                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                            )}
                          >
                            {matchType === "exact" && "Exact"}
                            {matchType === "starts" && "Starts"}
                            {matchType === "word" && "Word"}
                            {matchType === "contains" && "Contains"}
                          </span>
                        )}
                      </div>
                      {/* Show comment preview if available */}
                      {med.comment && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {med.comment.substring(0, 60)}...
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
