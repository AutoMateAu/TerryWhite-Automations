export type UserProfile = {
  id: string
  email: string
  username: string | null
  role: "admin" | "user" | "guest"
  hospital_id: string | null
}

export type Hospital = {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
}

export type PatientProfile = {
  id: string
  name: string
  dob: string | null
  address: string | null
  medicare: string | null
  allergies: string | null
  mrn: string | null
  phone: string | null
  hospital_id?: string | null
}

export type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  route: string
  notes: string | null
  patient_id: string
  charted_status: "charted" | "not charted" | "on hold" | "discontinued"
  medication_master_id: string | null
}

export type MedicationMaster = {
  id: string
  name: string
  description: string | null
}

export type NotificationItem = {
  id: string
  type: "reminder" | "message" | "alert"
  title: string
  content: string
  dueDate?: string | null
  isCompleted: boolean
  timestamp: string
  href?: string // Added href for navigation
}

export type DischargedForm = {
  id: string
  patient_id: string
  hospital_id: string | null
  discharge_date: string
  medications_at_discharge: Medication[] | null
  follow_up_plan: string | null
  discharge_summary_text: string | null
  template_name: string | null
  template_content: string | null
  created_at: string
  status?: "active" | "archived" | "draft" // Added status field
}

export type CustomerAccount = {
  id: string
  patientId: string
  patientName: string
  mrn: string | null
  phone: string | null
  totalOwed: number
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  dischargeFormIds: string[]
  status: "current" | "overdue" | "paid"
  createdAt: string
  dueDate: string | null
  hospitalId?: string | null // Added hospitalId
  hospitalName?: string | null // Added hospitalName for display
  daysOutstanding?: number // Added daysOutstanding
  patientType?: "in-patient" | "out-patient" // Added patientType
}

export type PaymentHistoryItem = {
  id: string
  customerAccountId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  notes: string | null
}

export type CallLog = {
  id: string
  customerAccountId: string
  callDate: string
  duration: number // in minutes
  notes: string | null
  outcome: string | null
}

export type SMSMessage = {
  id: string
  to: string
  body: string
  status: "sent" | "failed" | "delivered"
  createdAt: string
}

export type Template = {
  id: string
  name: string
  content: string
  created_at: string
}

export type Payment = {
  id: string
  accountId: string
  amount: number
  paymentDate: string
  method: string
  notes: string | null
  patientName?: string // Added for recent payments display
  mrn?: string // Added for recent payments display
}
