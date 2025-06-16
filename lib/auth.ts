"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import type { UserProfile } from "./types"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?message=${error.message}`)
  }

  return redirect("/dashboard")
}

export async function signUp(
  prevState: { success: boolean; message: string },
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as UserProfile["role"]
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: { role: role }, // Pass the selected role as user metadata
    },
  })

  if (error) {
    console.error("Supabase signUp error:", error.message)
    return { success: false, message: error.message }
  }

  // Removed the explicit user_profiles insert here.
  // The database trigger handle_new_user will now create the profile.

  // On successful signup, return success true and a message
  return { success: true, message: "Check your email to verify your account and then sign in." }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return redirect("/login")
}

export async function getUserSessionAndProfile(): Promise<{
  session: Awaited<ReturnType<typeof createClient>["auth"]["getSession"]>["data"]["session"]
  profile: UserProfile | null
  error: string | null
}> {
  const supabase = createClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return { session: null, profile: null, error: sessionError?.message || "No active session" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (profileError) {
    return { session, profile: null, error: profileError.message }
  }

  return { session, profile, error: null }
}

export async function updateUserRoleAndHospital(formData: FormData) {
  const supabase = createClient()
  const userId = formData.get("userId") as string
  const role = formData.get("role") as UserProfile["role"]
  const hospitalId = formData.get("hospitalId") as string | null

  const { error } = await supabase
    .from("user_profiles")
    .update({ role, hospital_id: hospitalId === "null" ? null : hospitalId })
    .eq("id", userId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: "User profile updated successfully." }
}

export async function getUsersWithProfiles() {
  const supabase = createClient()
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error("Error fetching users:", usersError.message)
    return { users: [], error: usersError.message }
  }

  const userIds = users.users.map((user) => user.id)

  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, role, hospital_id, hospitals(name)")
    .in("id", userIds)

  if (profilesError) {
    console.error("Error fetching user profiles:", profilesError.message)
    return { users: [], error: profilesError.message }
  }

  const usersWithProfiles = users.users.map((user) => {
    const profile = profiles.find((p) => p.id === user.id)
    return {
      ...user,
      profile: profile
        ? {
            id: profile.id,
            role: profile.role,
            hospital_id: profile.hospital_id,
            hospital_name: profile.hospitals?.name,
          }
        : null,
    }
  })

  return { users: usersWithProfiles, error: null }
}
