import type { Database } from "@/types/supabase"

export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type Medication = Database["public"]["Tables"]["medications_master"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type DischargedForm = Database["public"]["Tables"]["discharged_patient_forms"]["Row"]
export type CustomerAccount = Database["public"]["Tables"]["customer_accounts"]["Row"]
export type Payment = Database["public"]["Tables"]["payments"]["Row"]
export type CallLog = Database["public"]["Tables"]["call_logs"]["Row"]

export type UserRole = "admin" | "doctor" | "nurse"

export type UserProfile = {
  id: string
  role: UserRole
  hospital_id: string | null
}

export type Hospital = {
  id: string
  name: string
}

export type DischargedPatient = DischargedForm & {
  medications: Medication[]
}

export interface PatientProfile {
  id: string
  name: string
  dob: string
  mrn: string
  address: string
  medicare: string
  allergies: string
  phone: string // Added phone number
}

export interface PatientFormData {
  name: string
  dob: string
  mrn: string
  address: string
  medicare: string
  allergies: string
  phone: string
  admissionDate: string
  dischargeDate: string
  pharmacist: string
  dateListPrepared: string
  medications: Medication[]
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
}

export interface PaymentInterface {
  id: string
  accountId: string
  amount: number
  paymentDate: string
  method: string
  notes: string | null
}

export interface CallLogInterface {
  id: string
  accountId: string
  callDate: string
  comments: string
}

export interface MedicationPlan {
  id: string
  patientId: string
  medications: Medication[]
  startDate: string
  endDate: string
  notes?: string
}

export interface ExportOptions {
  startDate: Date
  endDate: Date
  patientIds: string[]
  includeAccountSummary: boolean
  includeContactInfo: boolean
  includeOutstandingBalance: boolean
  includePaymentHistory: boolean
  includeCallHistory: boolean
  includeNotes: boolean
}

export interface PatientDataForExport {
  patient: PatientProfile
  dischargeSummaries: DischargedPatient[]
  account: CustomerAccount | null
  paymentHistory: Payment[]
  callHistory: CallLog[]
  notes: string
  documents: PatientDocument[]
}

export interface PatientExportData {
  patient: PatientProfile
  medicationHistory: DischargedPatient[]
  accountingSummary: CustomerAccount | null
  paymentHistory: Payment[]
  callHistory: CallLog[]
  notes: string
  documents: PatientDocument[]
}

export interface PatientDocument {
  id: string
  patientId: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
}

export interface DischargedFormTemplate {
  id: string
  name: string
  templateContent: string
}

export interface UploadedFile extends File {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: string
}

export interface PDFExportOptions {
  includeAccountSummary: boolean
  includeContactInfo: boolean
  includeOutstandingBalance: boolean
  includeCallHistory: boolean
  includeNotes: boolean
}
