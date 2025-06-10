"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { CustomerAccount, CallLog, Payment } from "@/lib/types"
import { mockCustomerAccounts, mockPatients } from "@/lib/data" // Import mock data as fallback

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
    const { error: paymentsError } = await supabase.from("payments").select("id").limit(1)

    if (paymentsError && paymentsError.message.includes("does not exist")) {
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

// Helper function to get phone number from patient data
function getPatientPhone(patientId: string, mrn: string): string {
  // First try to find by patient ID
  const patientById = mockPatients.find((p) => p.id === patientId)
  if (patientById?.phone) {
    return patientById.phone
  }

  // Then try to find by MRN
  const patientByMrn = mockPatients.find((p) => p.mrn === mrn)
  if (patientByMrn?.phone) {
    return patientByMrn.phone
  }

  // Return placeholder if not found
  return "Contact pharmacy for phone number"
}

// Get all customer accounts
export async function getCustomerAccounts() {
  // First check if tables exist
  const tablesExist = await checkTablesExist()

  // If tables don't exist, return mock data with calculated status and phone numbers
  if (!tablesExist) {
    console.log("Tables don't exist, returning mock data")
    return mockCustomerAccounts.map((account) => {
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const calculatedDueDate = new Date(baseDate)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30)

      return {
        ...account,
        phone: account.phone || getPatientPhone(account.patientId, account.mrn),
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
      // Fall back to mock data if there's an error
      return mockCustomerAccounts
    }

    return data.map((account) => {
      const calculatedStatus = calculateAccountStatus(account)

      return {
        id: account.id,
        patientId: account.patient_id,
        patientName: account.patient_name,
        mrn: account.mrn,
        phone: account.phone || getPatientPhone(account.patient_id, account.mrn),
        totalOwed: account.total_owed,
        lastPaymentDate: account.last_payment_date,
        lastPaymentAmount: account.last_payment_amount,
        status: calculatedStatus, // Use calculated status instead of stored status
        dischargeFormIds: [], // We'll fetch these separately if needed
        createdAt: account.created_at,
        dueDate: account.due_date, // Include the actual due_date from DB
      }
    }) as CustomerAccount[]
  } catch (error) {
    console.error("Error in getCustomerAccounts:", error)
    // Fall back to mock data
    return mockCustomerAccounts
  }
}

// Get a single customer account by ID
export async function getCustomerAccountById(id: string) {
  // Check if tables exist
  const tablesExist = await checkTablesExist()

  // If tables don't exist, return mock data
  if (!tablesExist) {
    const account = mockCustomerAccounts.find((acc) => acc.id === id)
    if (account) {
      const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
      const calculatedDueDate = new Date(baseDate)
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30)
      return {
        ...account,
        phone: account.phone || getPatientPhone(account.patientId, account.mrn),
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
      // Try to find in mock data
      const account = mockCustomerAccounts.find((acc) => acc.id === id)
      return account || null
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      mrn: data.mrn,
      phone: data.phone || getPatientPhone(data.patient_id, data.mrn),
      totalOwed: data.total_owed,
      lastPaymentDate: data.last_payment_date,
      lastPaymentAmount: data.last_payment_amount,
      status: data.status,
      dischargeFormIds: [], // We'll fetch these separately if needed
      createdAt: data.created_at,
      dueDate: data.due_date, // Include the actual due_date from DB
    } as CustomerAccount
  } catch (error) {
    console.error("Error in getCustomerAccountById:", error)
    // Try to find in mock data
    const account = mockCustomerAccounts.find((acc) => acc.id === id)
    return account || null
  }
}

// Get discharge forms for a customer
export async function getDischargeFormsForCustomer(customerId: string) {
  // Check if tables exist
  const tablesExist = await checkTablesExist()

  // If tables don't exist, return empty array
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
      .from("payments")
      .select("*")
      .eq("account_id", accountId)
      .order("payment_date", { ascending: false })

    if (error) {
      console.error("Error fetching payment history:", error)
      return []
    }

    return (data || []).map((payment) => ({
      id: payment.id,
      accountId: payment.account_id,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      method: payment.method || "Unknown",
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
      .eq("account_id", accountId)
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
  // Check if tables exist
  const tablesExist = await checkTablesExist()

  // If tables don't exist, simulate success but show a warning
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
        customer_id: customerId,
        call_date: new Date().toISOString(),
        comments: comments,
        created_by: createdBy,
      })
      .select()

    if (callLogError) {
      console.error("Error adding call log:", callLogError)
      return { success: false, error: callLogError.message }
    }

    // Revalidate the accounting page to show updated data
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
  // Check if tables exist
  const tablesExist = await checkTablesExist()

  // If tables don't exist, simulate success but show a warning
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
      // If a payment is made, the account becomes current, and the due date is reset to 30 days from now
      const newDueDate = new Date()
      newDueDate.setDate(newDueDate.getDate() + 30)
      accountData.due_date = newDueDate.toISOString().split("T")[0] // Update due_date for status calculation
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
        due_date: accountData.due_date, // Update the due_date in DB
      })
      .eq("id", customerId)

    if (updateError) {
      console.error("Error updating account balance:", updateError)
      return { success: false, error: updateError.message }
    }

    // 6. Revalidate the accounting page to show updated data
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
    // First, get the current account details to calculate the new status
    const { data: accountData, error: fetchError } = await supabase
      .from("customer_accounts")
      .select("total_owed, created_at, last_payment_date")
      .eq("id", accountId)
      .single()

    if (fetchError) {
      console.error("Error fetching account for due date update:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Temporarily create an object to pass to calculateAccountStatus
    const tempAccount = {
      ...accountData,
      due_date: newDueDate, // Use the new due date for status calculation
    }
    const newStatus = calculateAccountStatus(tempAccount)

    const { error: updateError } = await supabase
      .from("customer_accounts")
      .update({
        due_date: newDueDate,
        status: newStatus, // Update status based on new due date
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
