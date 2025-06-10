import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Database%20of%20drugs-50bGQSKxwtcmk5brGyefQiEhOkizt4.csv"

async function parseTSV(tsvText: string) {
  const rows = tsvText
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row)

  if (rows.length === 0) {
    console.log("API Route: No data rows found after initial split and trim.")
    return []
  }
  const parsedData: { name: string; comment: string | null }[] = []
  for (const row of rows) {
    const values = row.split("\t")
    if (values.length >= 2) {
      const name = values[0].trim()
      const comment = values[1].trim()
      if (name) {
        parsedData.push({ name, comment })
      } else {
        console.warn("API Route: Skipping row with empty name:", row)
      }
    } else if (values.length === 1 && values[0]) {
      const name = values[0].trim()
      if (name) {
        parsedData.push({ name, comment: null })
      } else {
        console.warn("API Route: Skipping row with empty name (single column):", row)
      }
    } else {
      console.warn("API Route: Skipping malformed row (not enough columns or empty):", row)
    }
  }
  return parsedData
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    console.log("API Route: Fetching TSV data from:", CSV_URL)
    const response = await fetch(CSV_URL)
    if (!response.ok) {
      const errorBody = await response.text()
      console.error("API Route: Failed to fetch TSV - Status:", response.status, "Body:", errorBody)
      throw new Error(`Failed to fetch TSV: ${response.status} ${response.statusText}`)
    }
    const tsvText = await response.text()
    console.log("API Route: TSV data fetched successfully. Length:", tsvText.length)
    if (!tsvText.trim()) {
      console.error("API Route: TSV file is empty.")
      throw new Error("TSV file is empty.")
    }

    console.log("API Route: Parsing TSV data...")
    const medications = await parseTSV(tsvText)
    console.log(`API Route: Parsed ${medications.length} medications.`)
    if (medications.length === 0) {
      console.error("API Route: No medications parsed from TSV. Check file content and parsing logic.")
      throw new Error("No medications parsed from TSV.")
    }

    const dataToInsert = medications.map((med) => ({
      name: med.name,
      comment: med.comment,
    }))

    // Clear existing data from the table before inserting new data
    console.log("API Route: Deleting existing data from 'medications_master'...")
    const { error: deleteError } = await supabase
      .from("medications_master")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Deletes all rows
    if (deleteError) {
      console.error("API Route: Supabase error deleting old data:", deleteError)
      throw new Error(`Supabase error deleting old data: ${deleteError.message}`)
    }
    console.log("API Route: Successfully deleted old data from medications_master.")

    console.log("API Route: Inserting data into 'medications_master'...")
    const { data, error: insertError } = await supabase.from("medications_master").insert(dataToInsert) // Changed from upsert to insert

    if (insertError) {
      console.error("API Route: Supabase insert error:", insertError)
      throw new Error(`Supabase insert error: ${insertError.message}`)
    }

    console.log("API Route: Medication data population complete.")
    return NextResponse.json({
      message: `Successfully cleared and inserted ${dataToInsert.length} medications.`,
    })
  } catch (error: any) {
    console.error("API Route: Unhandled error in GET handler:", error)
    return NextResponse.json({ error: error.message, details: error.stack }, { status: 500 })
  }
}
