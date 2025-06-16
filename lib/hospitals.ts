"use server"

import { createClient } from "@/utils/supabase/server"
import type { Hospital } from "./types"

export async function getHospitals(): Promise<{ hospitals: Hospital[] | null; error: string | null }> {
  const supabase = createClient()
  const { data, error } = await supabase.from("hospitals").select("*")

  if (error) {
    return { hospitals: null, error: error.message }
  }

  return { hospitals: data, error: null }
}

export async function updateUserSelectedHospital(formData: FormData) {
  const supabase = createClient()
  const hospitalId = formData.get("hospitalId") as string
  const userId = formData.get("userId") as string

  const { error } = await supabase.from("user_profiles").update({ hospital_id: hospitalId }).eq("id", userId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: "Hospital updated successfully." }
}
