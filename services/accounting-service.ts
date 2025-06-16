"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  CustomerAccount,
  CallLog,
  Payment,
  PatientFormData,
  DischargedPatient,
  PatientProfile,
  PatientDocument,
  UserProfile,
  Medication,
} from "@/lib/types"
import { mockCustomerAccounts, mockPatients } from "@/lib/data" // Import mock data as fallback
import { put } from "@vercel/blob" // Import Vercel Blob put function

// Function to check if required tables exist
export async function checkTablesExist() {
  const supabase = createClient()

  try {
    // Check if customer_accounts table exists
    const { error: accountsError } = await supabase.from("customer_accounts").select("id").limit(1)

    if (accountsError && accountsError.message.includes("does not exist")) {
      return false
    }

    // Check if payments table exists
    const { error: paymentsError } = await supabase.from("payment_records").select("id").limit(1) // Corrected table name

    if (paymentsError && paymentsError.message.includes("does not exist")) {
      return false
    }

    // Check if patients table exists
    const { error: patientsError } = await supabase.from("patients").select("id").limit(1)

    if (patientsError && patientsError.message.includes("does not exist")) {
      return false
    }

    // Check if discharged_patient_forms table exists
    const { error: dischargedFormsError } = await supabase.from("discharged_patient_forms").select("id").limit(1)

    if (dischargedFormsError && dischargedFormsError.message.includes("does not exist")) {
      return false
    }

    // Check if hospitals table exists
    const { error: hospitalsError } = await supabase.from("hospitals").select("id").limit(1)
    if (hospitalsError && hospitalsError.message.includes("does not exist")) {
      return false
    }

    // Check if user_profiles table exists
    const { error: userProfilesError } = await supabase.from("user_profiles").select("id").limit(1)
    if (userProfilesError && userProfilesError.message.includes("does not exist")) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking tables:", error)
    return false
  }
}

// Function to check if call_logs table exists
export async function checkCallLogsTableExists() {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("call_logs").select("id").limit(1)

    return !error || !error.message.includes("does not exist")
  } catch (error) {
    console.error("Error checking call_logs table:", error)
    return false
  }
}

// Add a helper function to calculate account status based on due dates
function calculateAccountStatus(account: any): "current" | "overdue" | "paid" {
  // If no amount owed, it's paid
  if (account.total_owed === 0) {
    return "paid"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  let effectiveDueDate: Date

  // Prioritize the explicit due_date column
  if (account.due_date) {
    effectiveDueDate = new Date(account.due_date)
    effectiveDueDate.setHours(0, 0, 0, 0)
  } else {
    // Fallback to 30 days from last payment or account creation
    const baseDate = account.last_payment_date ? new Date(account.last_payment_date) : new Date(account.created_at)
    effectiveDueDate = new Date(baseDate)
    effectiveDueDate.setDate(effectiveDueDate.getDate() + 30)
    effectiveDueDate.setHours(0, 0, 0, 0)
  }

  // If due date has passed, it's overdue
  if (effectiveDueDate < today) {
    return "overdue"
  }

  // Otherwise it's current
  return "current"
}

// Helper function to get phone number from patient data (now from DB or mock)
async function getPatientPhoneFromDB(patientId: string, mrn: string): Promise<string | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("phone")
      .or(`id.eq.${patientId},mrn.eq.${mrn}`)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error fetching patient phone:", error)
      return null
    }
    return data?.phone || null
  } catch (error) {
    console.error("Error in getPatientPhoneFromDB:", error)
    return null
  }
}

// Get all customer accounts
export async function getCustomerAccounts() {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    console.log("Tables don't exist, returning mock data for customer accounts")
    return mockCustomerAccounts.map((account) => {
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const calculatedDueDate = new Date(baseDate)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30)

      return {
        ...account,
        phone: account.phone || "Contact pharmacy for phone number", // Mock phone
        status:
          account.totalOwed === 0
            ? ("paid" as const)
            : calculatedDueDate < new Date()
              ? ("overdue" as const)
              : ("current" as const),
        dueDate: calculatedDueDate.toISOString().split("T")[0], // Add calculated due date for mock data
      }
    })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("*")
      .order("total_owed", { ascending: false })

    if (error) {
      console.error("Error fetching customer accounts:", error)
      return [] // Return empty array on DB error
    }

    const accountsWithPhone = await Promise.all(
      data.map(async (account) => {
        const calculatedStatus = calculateAccountStatus(account)
        const phone = account.phone || (await getPatientPhoneFromDB(account.patient_id, account.mrn))

        return {
          id: account.id,
          patientId: account.patient_id,
          patientName: account.patient_name,
          mrn: account.mrn,
          phone: phone,
          totalOwed: account.total_owed,
          lastPaymentDate: account.last_payment_date,
          lastPaymentAmount: account.last_payment_amount,
          status: calculatedStatus,
          dischargeFormIds: [], // Will fetch separately if needed
          createdAt: account.created_at,
          dueDate: account.due_date,
        }
      }),
    )
    return accountsWithPhone as CustomerAccount[]
  } catch (error) {
    console.error("Error in getCustomerAccounts:", error)
    return []
  }
}

// Get a single customer account by ID
export async function getCustomerAccountById(id: string) {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    console.log("Tables don't exist, returning mock data for single customer account")
    const account = mockCustomerAccounts.find((acc) => acc.id === id)
    if (account) {
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const calculatedDueDate = new Date(baseDate)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30)
      return {
        ...account,
        phone: account.phone || "Contact pharmacy for phone number",
        dueDate: calculatedDueDate.toISOString().split("T")[0],
      }
    }
    return null
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("customer_accounts").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching customer account:", error)
      return null
    }

    const phone = data.phone || (await getPatientPhoneFromDB(data.patient_id, data.mrn))

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      mrn: data.mrn,
      phone: phone,
      totalOwed: data.total_owed,
      lastPaymentDate: data.last_payment_date,
      lastPaymentAmount: data.last_payment_amount,
      status: data.status,
      dischargeFormIds: [], // Will fetch separately if needed
      createdAt: data.created_at,
      dueDate: data.due_date,
    } as CustomerAccount
  } catch (error) {
    console.error("Error in getCustomerAccountById:", error)
    return null
  }
}

// NEW: Get a single customer account by patient ID
export async function getCustomerAccountByPatientId(patientId: string) {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Cannot fetch customer account by patient ID.")
    return null
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("customer_accounts").select("*").eq("patient_id", patientId).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching customer account by patient ID:", error)
      return null
    }
    if (!data) return null

    const phone = data.phone || (await getPatientPhoneFromDB(data.patient_id, data.mrn))

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      mrn: data.mrn,
      phone: phone,
      totalOwed: data.total_owed,
      lastPaymentDate: data.last_payment_date,
      lastPaymentAmount: data.last_payment_amount,
      status: calculateAccountStatus(data),
      dischargeFormIds: [], // Not directly stored here, fetch separately if needed
      createdAt: data.created_at,
      dueDate: data.due_date,
    } as CustomerAccount
  } catch (error) {
    console.error("Error in getCustomerAccountByPatientId:", error)
    return null
  }
}

// Get all patients
export async function getPatients(): Promise<PatientProfile[]> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Returning mock patient data.")
    return mockPatients
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("patients").select("*").order("name", { ascending: true })
    if (error) {
      console.error("Error fetching patients:", error)
      return []
    }
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      dob: p.dob,
      address: p.address || "",
      medicare: p.medicare || "",
      allergies: p.allergies || "",
      mrn: p.mrn,
      phone: p.phone || null,
    })) as PatientProfile[]
  } catch (error) {
    console.error("Error in getPatients:", error)
    return []
  }
}

// NEW: Get a single patient by ID
export async function getPatientById(id: string): Promise<PatientProfile | null> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Cannot fetch patient by ID.")
    return null
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase.from("patients").select("*").eq("id", id).single()
    if (error && error.code !== "PGRST116") {
      console.error("Error fetching patient by ID:", error)
      return null
    }
    if (!data) return null

    return {
      id: data.id,
      name: data.name,
      dob: data.dob,
      address: data.address || "",
      medicare: data.medicare || "",
      allergies: data.allergies || "",
      mrn: data.mrn,
      phone: data.phone || null,
    } as PatientProfile
  } catch (error) {
    console.error("Error in getPatientById:", error)
    return null
  }
}

// Add or update a patient
export async function upsertPatient(
  patientData: Omit<PatientProfile, "id"> & { id?: string },
): Promise<{ success: boolean; patient?: PatientProfile; error?: string }> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return { success: false, error: "Database tables not set up yet." }
  }

  const supabase = createClient()

  try {
    let data
    let error

    if (patientData.id) {
      // Attempt to update existing patient
      const { data: updateData, error: updateError } = await supabase
        .from("patients")
        .update({
          name: patientData.name,
          dob: patientData.dob,
          address: patientData.address,
          medicare: patientData.medicare,
          allergies: patientData.allergies,
          mrn: patientData.mrn,
          phone: patientData.phone,
        })
        .eq("id", patientData.id)
        .select()
        .single()
      data = updateData
      error = updateError
    } else {
      // Check if patient with MRN already exists
      const { data: existingPatient, error: existingError } = await supabase
        .from("patients")
        .select("id")
        .eq("mrn", patientData.mrn)
        .single()

      if (existingError && existingError.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Error checking for existing patient:", existingError)
        return { success: false, error: existingError.message }
      }

      if (existingPatient) {
        // Patient with this MRN already exists, update it
        const { data: updateData, error: updateError } = await supabase
          .from("patients")
          .update({
            name: patientData.name,
            dob: patientData.dob,
            address: patientData.address,
            medicare: patientData.medicare,
            allergies: patientData.allergies,
            phone: patientData.phone,
          })
          .eq("id", existingPatient.id)
          .select()
          .single()
        data = updateData
        error = updateError
      } else {
        // Insert new patient
        const { data: insertData, error: insertError } = await supabase
          .from("patients")
          .insert({
            name: patientData.name,
            dob: patientData.dob,
            address: patientData.address,
            medicare: patientData.medicare,
            allergies: patientData.allergies,
            mrn: patientData.mrn,
            phone: patientData.phone,
          })
          .select()
          .single()
        data = insertData
        error = insertError
      }
    }

    if (error) {
      console.error("Error upserting patient:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/patients")
    revalidatePath("/accounting") // Patient info might affect accounting view

    return {
      success: true,
      patient: {
        id: data.id,
        name: data.name,
        dob: data.dob,
        address: data.address || "",
        medicare: data.medicare || "",
        allergies: data.allergies || "",
        mrn: data.mrn,
        phone: data.phone || null,
      },
    }
  } catch (e: any) {
    console.error("Unexpected error in upsertPatient:", e)
    return { success: false, error: e.message || "An unexpected error occurred." }
  }
}

// Get all discharged forms (now accepts UserProfile for filtering)
export async function getDischargedForms(userProfile: UserProfile): Promise<DischargedPatient[]> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Returning empty array.")
    return []
  }

  const supabase = createClient()
  try {
    let query = supabase
      .from("discharged_patient_forms")
      .select("*, hospitals(name)") // Select hospital name from joined table
      .order("discharge_timestamp", { ascending: false })

    // Apply filtering based on user role and hospital affiliation
    if (userProfile.role === "doctor" || userProfile.role === "nurse") {
      if (userProfile.hospitalId) {
        query = query.eq("hospital_id", userProfile.hospitalId)
      } else {
        // If doctor/nurse but no hospital selected, return no forms
        return []
      }
    }
    // Admins get all forms (no additional filter needed)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching discharged forms:", error)
      return []
    }

    return data.map((form) => ({
      id: form.id,
      patientId: form.patient_id || "", // Ensure patientId is not null
      name: form.name,
      address: form.address,
      medicare: form.medicare,
      allergies: form.allergies,
      dob: form.dob,
      mrn: form.mrn,
      phone: form.phone,
      admissionDate: form.admission_date,
      dischargeDate: form.discharge_date,
      pharmacist: form.pharmacist,
      dateListPrepared: form.date_list_prepared,
      concession: form.concession,
      healthFund: form.health_fund,
      reasonForAdmission: form.reason_for_admission,
      relevantPastMedicalHistory: form.relevant_past_medical_history,
      communityPharmacist: form.community_pharmacist,
      generalPractitioner: form.general_practitioner,
      medicationRisksComments: form.medication_risks_comments,
      sourcesOfHistory: form.sources_of_history,
      pharmacistSignature: form.pharmacist_signature,
      dateTimeSigned: form.date_time_signed,
      dischargeTimestamp: form.discharge_timestamp,
      templateType: form.template_type || "new", // Default to 'new' if not set
      hospitalName: (form.hospitals as { name: string } | null)?.name || form.hospital_name || null, // Prefer joined name, fallback to existing
      hospitalId: form.hospital_id,
      medications: form.medications, // JSONB column
      createdAt: form.created_at,
      updatedAt: form.updated_at,
    })) as DischargedPatient[]
  } catch (error) {
    console.error("Error in getDischargedForms:", error)
    return []
  }
}

// NEW: Get discharged forms by patient ID
export async function getDischargeFormsByPatientId(patientId: string): Promise<DischargedPatient[]> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Cannot fetch discharged forms by patient ID.")
    return []
  }

  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("discharged_patient_forms")
      .select("*, hospitals(name)")
      .eq("patient_id", patientId)
      .order("discharge_timestamp", { ascending: false })

    if (error) {
      console.error("Error fetching discharged forms by patient ID:", error)
      return []
    }

    return data.map((form) => ({
      id: form.id,
      patientId: form.patient_id || "",
      name: form.name,
      address: form.address,
      medicare: form.medicare,
      allergies: form.allergies,
      dob: form.dob,
      mrn: form.mrn,
      phone: form.phone,
      admissionDate: form.admission_date,
      dischargeDate: form.discharge_date,
      pharmacist: form.pharmacist,
      dateListPrepared: form.date_list_prepared,
      concession: form.concession,
      healthFund: form.health_fund,
      reasonForAdmission: form.reason_for_admission,
      relevantPastMedicalHistory: form.relevant_past_medical_history,
      communityPharmacist: form.community_pharmacist,
      generalPractitioner: form.general_practitioner,
      medicationRisksComments: form.medication_risks_comments,
      sourcesOfHistory: form.sources_of_history,
      pharmacistSignature: form.pharmacist_signature,
      dateTimeSigned: form.date_time_signed,
      dischargeTimestamp: form.discharge_timestamp,
      templateType: form.template_type || "new",
      hospitalName: (form.hospitals as { name: string } | null)?.name || form.hospital_name || null,
      hospitalId: form.hospital_id,
      medications: form.medications,
      createdAt: form.created_at,
      updatedAt: form.updated_at,
    })) as DischargedPatient[]
  } catch (error) {
    console.error("Error in getDischargeFormsByPatientId:", error)
    return []
  }
}

// Get discharge forms for a customer (already exists, but ensure it uses DB)
export async function getDischargeFormsForCustomer(customerId: string) {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    return []
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("discharge_form_accounts")
      .select("discharge_form_id, discharged_patient_forms(*)")
      .eq("customer_id", customerId)

    if (error) {
      console.error("Error fetching discharge forms:", error)
      return []
    }

    return data.map((item) => item.discharged_patient_forms)
  } catch (error) {
    console.error("Error in getDischargeFormsForCustomer:", error)
    return []
  }
}

export async function getPaymentHistory(accountId: string): Promise<Payment[]> {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.warn("Required tables do not exist. Please run the database setup scripts.")
    return []
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("payment_records") // Corrected table name
      .select("*")
      .eq("customer_id", accountId) // Use customer_id as per schema
      .order("payment_date", { ascending: false })

    if (error) {
      console.error("Error fetching payment history:", error)
      return []
    }

    return (data || []).map((payment) => ({
      id: payment.id,
      accountId: payment.customer_id, // Map to accountId
      amount: payment.amount,
      paymentDate: payment.payment_date,
      method: payment.payment_method || "Unknown",
      notes: payment.notes || "",
    }))
  } catch (error) {
    console.error("Error in getPaymentHistory:", error)
    return []
  }
}

export async function getCallHistory(accountId: string): Promise<CallLog[]> {
  const callLogsExist = await checkCallLogsTableExists()
  if (!callLogsExist) {
    console.warn("call_logs table does not exist. Please run the database setup scripts.")
    return []
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .eq("customer_id", accountId)
      .order("call_date", { ascending: false })

    if (error) {
      console.error("Error fetching call history:", error)
      return []
    }

    return (data || []).map((call) => ({
      id: call.id,
      accountId: call.account_id,
      callDate: call.call_date,
      comments: call.comments || "",
    }))
  } catch (error) {
    console.error("Error in getCallHistory:", error)
    return []
  }
}

// Add a new call log
export async function addCallLog(customerId: string, comments: string, createdBy = "Pharmacy Staff") {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    console.log("Tables don't exist, simulating call log creation")
    return {
      success: true,
      callLog: {
        id: "mock-call-" + Date.now(),
        customer_id: customerId,
        call_date: new Date().toISOString(),
        comments: comments,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      },
      warning: "Using mock data. Database tables not set up yet.",
    }
  }

  const supabase = createClient()

  try {
    const { data: callLogData, error: callLogError } = await supabase
      .from("call_logs")
      .insert({
        account_id: customerId, // Use account_id as per schema
        call_date: new Date().toISOString(),
        comments: comments,
        created_by: createdBy,
      })
      .select()

    if (callLogError) {
      console.error("Error adding call log:", callLogError)
      return { success: false, error: callLogError.message }
    }

    revalidatePath("/accounting")

    return { success: true, callLog: callLogData[0] }
  } catch (error) {
    console.error("Error in addCallLog:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Record a new payment
export async function recordPayment(
  customerId: string,
  amount: number,
  paymentMethod: "cash" | "card" | "insurance" | "other",
  notes?: string,
) {
  const tablesExist = await checkTablesExist()

  if (!tablesExist) {
    console.log("Tables don't exist, simulating payment recording")
    return {
      success: true,
      payment: {
        id: "mock-payment-" + Date.now(),
        customer_id: customerId,
        amount: amount,
        payment_method: paymentMethod,
        notes: notes || null,
        payment_date: new Date().toISOString(),
      },
      warning: "Using mock data. Database tables not set up yet.",
    }
  }

  const supabase = createClient()

  try {
    // 1. Insert the payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment_records")
      .insert({
        customer_id: customerId,
        amount: amount,
        payment_method: paymentMethod,
        notes: notes || null,
        payment_date: new Date().toISOString(),
      })
      .select()

    if (paymentError) {
      console.error("Error recording payment:", paymentError)
      return { success: false, error: paymentError.message }
    }

    // 2. Get the current account details
    const { data: accountData, error: accountError } = await supabase
      .from("customer_accounts")
      .select("total_owed, created_at, due_date")
      .eq("id", customerId)
      .single()

    if (accountError) {
      console.error("Error fetching account details:", accountError)
      return { success: false, error: accountError.message }
    }

    // 3. Calculate the new balance
    const newBalance = Math.max(0, accountData.total_owed - amount)

    // 4. Calculate the new status based on the new balance and payment date
    let newStatus: "current" | "overdue" | "paid"
    if (newBalance === 0) {
      newStatus = "paid"
    } else {
      const newDueDate = new Date()
      newDueDate.setDate(newDueDate.getDate() + 30)
      accountData.due_date = newDueDate.toISOString().split("T")[0]
      newStatus = calculateAccountStatus(accountData)
    }

    // 5. Update the customer account
    const { error: updateError } = await supabase
      .from("customer_accounts")
      .update({
        total_owed: newBalance,
        last_payment_date: new Date().toISOString().split("T")[0],
        last_payment_amount: amount,
        status: newStatus,
        due_date: accountData.due_date,
      })
      .eq("id", customerId)

    if (updateError) {
      console.error("Error updating account balance:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/accounting")

    return { success: true, payment: paymentData[0] }
  } catch (error) {
    console.error("Error in recordPayment:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// New server action to update account due date
export async function updateAccountDueDate(accountId: string, newDueDate: string) {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return { success: false, error: "Database tables not set up yet." }
  }

  const supabase = createClient()

  try {
    const { data: accountData, error: fetchError } = await supabase
      .from("customer_accounts")
      .select("total_owed, created_at, last_payment_date")
      .eq("id", accountId)
      .single()

    if (fetchError) {
      console.error("Error fetching account for due date update:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const tempAccount = {
      ...accountData,
      due_date: newDueDate,
    }
    const newStatus = calculateAccountStatus(tempAccount)

    const { error: updateError } = await supabase
      .from("customer_accounts")
      .update({
        due_date: newDueDate,
        status: newStatus,
      })
      .eq("id", accountId)

    if (updateError) {
      console.error("Error updating due date:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/accounting")
    return { success: true }
  } catch (error) {
    console.error("Error in updateAccountDueDate:", error)
    return { success: false, error: "An unexpected error occurred." }
  }
}

// NEW SERVER ACTION: Submit Medication Plan to DB (Patient, Discharge Form, Account)
export async function submitMedicationPlanToDB(
  formData: PatientFormData,
  templateType: "before-admission" | "after-admission" | "new" | "hospital-specific",
  hospitalName?: string,
  hospitalId?: string, // New parameter for hospital ID
) {
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    return { success: false, error: "Database tables not set up yet. Please run the setup scripts." }
  }

  const supabase = createClient()

  try {
    // 1. Upsert Patient
    let patientId: string
    const { data: existingPatient, error: existingPatientError } = await supabase
      .from("patients")
      .select("id")
      .eq("mrn", formData.mrn)
      .single()

    if (existingPatientError && existingPatientError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error checking for existing patient:", existingPatientError)
      return { success: false, error: existingPatientError.message }
    }

    if (existingPatient) {
      patientId = existingPatient.id
      // Update existing patient details
      const { error: updatePatientError } = await supabase
        .from("patients")
        .update({
          name: formData.name,
          dob: formData.dob,
          address: formData.address,
          medicare: formData.medicare,
          allergies: formData.allergies,
          phone: formData.phone || null,
        })
        .eq("id", patientId)
      if (updatePatientError) {
        console.error("Error updating patient:", updatePatientError)
        return { success: false, error: updatePatientError.message }
      }
    } else {
      // Insert new patient
      const { data: newPatient, error: insertPatientError } = await supabase
        .from("patients")
        .insert({
          name: formData.name,
          dob: formData.dob,
          address: formData.address,
          medicare: formData.medicare,
          allergies: formData.allergies,
          mrn: formData.mrn,
          phone: formData.phone || null,
        })
        .select("id")
        .single()
      if (insertPatientError) {
        console.error("Error inserting new patient:", insertPatientError)
        return { success: false, error: insertPatientError.message }
      }
      patientId = newPatient.id
    }

    // 2. Insert Discharged Form
    const { data: dischargedFormData, error: dischargedFormError } = await supabase
      .from("discharged_patient_forms")
      .insert({
        patient_id: patientId,
        name: formData.name,
        address: formData.address,
        medicare: formData.medicare,
        allergies: formData.allergies,
        dob: formData.dob,
        mrn: formData.mrn,
        phone: formData.phone || null,
        admission_date: formData.admissionDate || null,
        discharge_date: formData.dischargeDate || null,
        pharmacist: formData.pharmacist || null,
        date_list_prepared: formData.dateListPrepared,
        discharge_timestamp: new Date().toISOString(), // Current timestamp
        template_type: templateType,
        hospital_name: hospitalName || null,
        hospital_id: hospitalId || null, // Store hospital ID
        medications: formData.medications as any, // Cast to any for JSONB
        concession: formData.concession || null,
        health_fund: formData.healthFund || null,
        reason_for_admission: formData.reasonForAdmission || null,
        relevant_past_medical_history: formData.relevantPastMedicalHistory || null,
        community_pharmacist: formData.communityPharmacist || null,
        general_practitioner: formData.generalPractitioner || null,
        medication_risks_comments: formData.medicationRisksComments || null,
        sources_of_history: formData.sourcesOfHistory || null,
        pharmacist_signature: formData.pharmacistSignature || null,
        date_time_signed: formData.dateTimeSigned || null,
      })
      .select("id")
      .single()

    if (dischargedFormError) {
      console.error("Error inserting discharged form:", dischargedFormError)
      return { success: false, error: dischargedFormError.message }
    }
    const dischargeFormId = dischargedFormData.id

    // 3. Upsert Customer Account
    let customerAccountId: string
    const { data: existingAccount, error: existingAccountError } = await supabase
      .from("customer_accounts")
      .select("id")
      .eq("patient_id", patientId)
      .single()

    if (existingAccountError && existingAccountError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error checking for existing account:", existingAccountError)
      return { success: false, error: existingAccountError.message }
    }

    if (existingAccount) {
      customerAccountId = existingAccount.id
      // If account exists, you might want to update its total_owed if new medications are added
      // For now, we'll assume total_owed is managed by payments, but if you want to add to it
      // based on new forms, you'd fetch the current total_owed and add to it here.
    } else {
      // Create new account
      const totalOwed = formData.medications.length * 100 // Each medication costs $100
      const { data: newAccount, error: insertAccountError } = await supabase
        .from("customer_accounts")
        .insert({
          patient_id: patientId,
          patient_name: formData.name,
          mrn: formData.mrn,
          total_owed: totalOwed, // New accounts start with 0 owed
          status: "current",
          phone: formData.phone || null,
          // last_payment_date, last_payment_amount, due_date will be null initially
        })
        .select("id")
        .single()
      if (insertAccountError) {
        console.error("Error inserting new customer account:", insertAccountError)
        return { success: false, error: insertAccountError.message }
      }
      customerAccountId = newAccount.id
    }

    // Revalidate paths to show updated data
    revalidatePath("/discharge")
    revalidatePath("/accounting")
    revalidatePath("/patients")

    return { success: true, dischargeFormId, customerAccountId, patientId }
  } catch (e: any) {
    console.error("Unexpected error in submitMedicationPlanToDB:", e)
    return { success: false, error: e.message || "An unexpected error occurred." }
  }
}

// Placeholder for saving patient notes (requires new DB table: patient_notes)
export async function savePatientNotes(patientId: string, notes: string) {
  console.log(`Simulating saving notes for patient ${patientId}:`, notes)
  // In a real application, you would insert/update a 'patient_notes' table here.
  // Example:
  // const supabase = createClient();
  // const { data, error } = await supabase.from('patient_notes').upsert({ patient_id: patientId, notes: notes }, { onConflict: ['patient_id'] });
  // if (error) { console.error("Error saving notes:", error); return { success: false, error: error.message }; }
  revalidatePath(`/patients/${patientId}`) // Revalidate the patient's page
  return { success: true }
}

// Server action for uploading patient documents to Vercel Blob
export async function uploadPatientDocument(patientId: string, file: File) {
  try {
    // 1. Upload file to Vercel Blob
    const { url } = await put(file.name, file, { access: "public" })

    // 2. Save document metadata to Supabase (requires a 'patient_documents' table)
    const supabase = createClient()
    const { error } = await supabase.from("patient_documents").insert({
      patient_id: patientId,
      file_name: file.name,
      file_url: url,
      file_type: file.type,
      uploaded_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving document metadata to DB:", error)
      // If DB save fails, you might want to delete the blob or log for manual cleanup
      return { success: false, error: error.message }
    }

    revalidatePath(`/patients/${patientId}`) // Revalidate the patient's page to show new document
    return { success: true, url }
  } catch (error: any) {
    console.error("Error in uploadPatientDocument:", error)
    return { success: false, error: error.message || "An unexpected error occurred during upload." }
  }
}

// NEW: Get patient documents
export async function getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("patient_documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Error fetching patient documents:", error)
      return []
    }

    return data.map((doc) => ({
      id: doc.id,
      patientId: doc.patient_id,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      fileType: doc.file_type,
      uploadedAt: doc.uploaded_at,
    })) as PatientDocument[]
  } catch (error) {
    console.error("Error in getPatientDocuments:", error)
    return []
  }
}

export async function createDischargedForm(formData: {
  patient_name: string
  diagnosis: string
  discharge_date: string
  medications: Medication[]
  notes: string
  template: string
  hospital_id: string | null
}) {
  const supabase = createClient()

  const { data, error } = await supabase.from("discharged_patient_forms").insert({
    patient_name: formData.patient_name,
    diagnosis: formData.diagnosis,
    discharge_date: formData.discharge_date,
    medications_jsonb: formData.medications,
    notes: formData.notes,
    template: formData.template,
    hospital_id: formData.hospital_id,
  })

  if (error) {
    console.error("Error creating discharged form:", error.message)
    return { success: false, message: error.message }
  }

  revalidatePath("/discharge")
  return { success: true, message: "Discharge form created successfully." }
}

export async function updateDischargedForm(
  id: string,
  formData: {
    patient_name?: string
    diagnosis?: string
    discharge_date?: string
    medications?: Medication[]
    notes?: string
    template?: string
    hospital_id?: string | null
  },
) {
  const supabase = createClient()

  const updateData: {
    patient_name?: string
    diagnosis?: string
    discharge_date?: string
    medications_jsonb?: Medication[]
    notes?: string
    template?: string
    hospital_id?: string | null
  } = {
    patient_name: formData.patient_name,
    diagnosis: formData.diagnosis,
    discharge_date: formData.discharge_date,
    notes: formData.notes,
    template: formData.template,
    hospital_id: formData.hospital_id,
  }

  if (formData.medications !== undefined) {
    updateData.medications_jsonb = formData.medications
  }

  const { data, error } = await supabase.from("discharged_patient_forms").update(updateData).eq("id", id)

  if (error) {
    console.error("Error updating discharged form:", error.message)
    return { success: false, message: error.message }
  }

  revalidatePath("/discharge")
  return { success: true, message: "Discharge form updated successfully." }
}

  const supabase = createClient()

  const { data, error } = await supabase.from("payments").insert({
    customer_account_id: formData.customer_account_id,
    amount: formData.amount,
    payment_date: formData.payment_date,
    notes: formData.notes,
  })

  if (error) {
    console.error("Error recording payment:", error.message)
    return { success: false, message: error.message }
  }

  revalidatePath("/accounting")
  revalidatePath(`/accounts/${formData.customer_account_id}`)
  return { success: true, message: "Payment recorded successfully." }
}

export async function getCustomerAccounts(): Promise<{
  accounts: (CustomerAccount & { payments: Payment[] })[] | null
  error: string | null
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("customer_accounts")
    .select("*, payments(*)")
    .order("created_at", { ascending: false })
    .order("payment_date", { foreignTable: "payments", ascending: false })

  if (error) {
    console.error("Error fetching customer accounts:", error.message)
    return { accounts: null, error: error.message }
  }

  return { accounts: data, error: null }
}

export async function getCustomerAccountById(
  id: string,
): Promise<{ account: (CustomerAccount & { payments: Payment[] }) | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("customer_accounts")
    .select("*, payments(*)")
    .eq("id", id)
    .single()
    .order("payment_date", { foreignTable: "payments", ascending: false })

  if (error) {
    console.error("Error fetching customer account:", error.message)
    return { account: null, error: error.message }
  }

  return { account: data, error: null }
}

export async function updateCustomerAccountDueDate(accountId: string, newDueDate: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("customer_accounts")
    .update({ due_date: newDueDate })
    .eq("id", accountId)

  if (error) {
    console.error("Error updating due date:", error.message)
    return { success: false, message: error.message }
  }

  revalidatePath("/accounting")
  revalidatePath(`/accounts/${accountId}`)
  return { success: true, message: "Due date updated successfully." }
}
