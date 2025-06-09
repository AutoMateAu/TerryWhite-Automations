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
  pageInfo: string
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

export interface TaskItem {
  id: string
  title: string
  isCompleted: boolean
  priority: "low" | "medium" | "high"
  dueDate: string
}

export interface SalesRecord {
  month: string
  revenue: number
}
