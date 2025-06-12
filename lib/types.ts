import type { Json } from "@/types/supabase"

export interface PatientProfile {
  id: string
  name: string
  dob: string
  address: string
  medicare: string
  allergies: string
  mrn: string
  phone: string | null
  // currentMedications: MedicationItem[] // This will be part of the discharge form or a separate medication history
}

export interface MedicationItem {
  name: string
  dosage: string
  frequency: string
}

export interface NotificationItem {
  id: string
  type: "reminder" | "message"
  title: string
  content: string
  dueDate?: string // ISO date string
  isCompleted: boolean
  timestamp: string // ISO date string
}

export interface CustomerAccount {
  id: string
  patientId: string
  patientName: string
  mrn: string
  phone: string | null
  totalOwed: number
  lastPaymentDate: string | null
  lastPaymentAmount: number | null
  status: "current" | "overdue" | "paid"
  dischargeFormIds: string[] // IDs of associated discharge forms
  createdAt: string
  dueDate: string | null // ISO date string for explicit due date
}

export interface Payment {
  id: string
  accountId: string
  amount: number
  paymentDate: string
  method: "cash" | "card" | "insurance" | "other" | "Unknown"
  notes: string
}

export interface CallLog {
  id: string
  accountId: string
  callDate: string
  comments: string
}

// Medication types for the form and database
export interface Medication {
  id: string
  name: string
  // For default/after-admission template
  times?: { [key: string]: string } // e.g., { "7am": "1 tab", "Noon": "" }
  status?: string // e.g., "Active", "Discontinued"
  comments?: string
  isCommentOnly?: boolean // New field to control merged comment view
  // For before-admission template
  dosageFrequency?: string
  homeNewStatus?: string // "Home", "New"
  chartedStatus?: string // "Yes", "No"
  commentsActions?: string
  drSignActionCompleted?: string
}

export interface MedicationWithComment {
  name: string
  comment?: string
}

// Patient form data, including all fields from both template types
export interface PatientFormData {
  name: string
  address: string
  medicare: string
  allergies: string
  dob: string
  mrn: string
  // Fields for default/after-admission
  phone?: string
  admissionDate?: string
  dischargeDate?: string
  pharmacist?: string
  dateListPrepared: string
  // Fields for before-admission
  concession?: string
  healthFund?: string
  reasonForAdmission?: string
  relevantPastMedicalHistory?: string
  communityPharmacist?: string
  generalPractitioner?: string
  medicationRisksComments?: string
  sourcesOfHistory?: string
  pharmacistSignature?: string
  dateTimeSigned?: string
  medications: Medication[]
}

// DischargedPatient type for the database, reflecting the full form data
export interface DischargedPatient {
  id: string
  patientId: string // Link to the patients table
  name: string
  address: string | null
  medicare: string | null
  allergies: string | null
  dob: string | null
  mrn: string
  // Fields from default/after-admission
  phone: string | null
  admissionDate: string | null
  dischargeDate: string | null
  pharmacist: string | null
  dateListPrepared: string | null
  // Fields from before-admission
  concession: string | null
  healthFund: string | null
  reasonForAdmission: string | null
  relevantPastMedicalHistory: string | null
  communityPharmacist: string | null
  generalPractitioner: string | null
  medicationRisksComments: string | null
  sourcesOfHistory: string | null
  pharmacistSignature: string | null
  dateTimeSigned: string | null
  // Common fields
  dischargeTimestamp: string
  templateType: "before-admission" | "after-admission" | "new" | "hospital-specific"
  hospitalName: string | null
  medications: Json // Stored as JSONB in DB
  createdAt: string
  updatedAt: string
}
