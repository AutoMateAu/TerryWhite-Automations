export interface Medication {
  id: string
  name: string
  times: {
    "7am": string
    "8am": string
    Noon: string
    "2pm": string
    "6pm": string
    "8pm": string
    "10pm": string
  }
  status: string
  comments: string
}

export interface PatientFormData {
  name: string
  address: string
  medicare: string
  allergies: string
  dob: string
  mrn: string
  admissionDate: string
  dischargeDate: string
  pharmacist: string
  dateListPrepared: string
  phoneNumber?: string // Add phone number as optional field
  medications: Medication[]
}

export interface PatientProfile {
  id: string
  name: string
  dob: string
  address: string
  medicare: string
  allergies: string
  mrn: string
  phoneNumber?: string // Add phone number here too
  currentMedications: Array<{ name: string; dosage: string; frequency: string }>
}

export interface NotificationItem {
  id: string
  type: "message" | "reminder"
  title: string
  content: string
  dueDate?: string
  isCompleted?: boolean
  timestamp: string
}

export interface DischargedPatient extends PatientFormData {
  id: string
  dischargeTimestamp: string
}

export interface MedicationWithComment {
  id: string
  name: string
  comment: string | null
}
