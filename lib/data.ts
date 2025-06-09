import type {
  PatientProfile,
  NotificationItem,
  DischargedPatient,
  TaskItem,
  SalesRecord,
} from "./types"

export const mockPatients: PatientProfile[] = [
  {
    id: "1",
    name: "John Doe",
    dob: "1985-07-12",
    address: "123 Main St, Anytown, USA",
    medicare: "1234567890",
    allergies: "Penicillin, Peanuts",
    mrn: "MRN001",
    currentMedications: [
      { name: "Lisinopril 10mg", dosage: "1 tablet", frequency: "Once daily" },
      { name: "Metformin 500mg", dosage: "1 tablet", frequency: "Twice daily" },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    dob: "1992-03-25",
    address: "456 Oak Ave, Anytown, USA",
    medicare: "0987654321",
    allergies: "None known",
    mrn: "MRN002",
    currentMedications: [{ name: "Amoxicillin 250mg", dosage: "1 capsule", frequency: "Three times daily" }],
  },
]

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "reminder",
    title: "Refill Statins for Mr. Johnson",
    content: "Order due by end of day.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
    isCompleted: false,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: "n2",
    type: "message",
    title: "New prescription for Alice Brown",
    content: "Dr. Emily Carter sent a new e-prescription. Please review.",
    timestamp: new Date().toISOString(),
  },
  {
    id: "n3",
    type: "reminder",
    title: "Check Warfarin INR for Mrs. Davis",
    content: "Scheduled for today.",
    dueDate: new Date().toISOString().split("T")[0],
    isCompleted: true,
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
]

export const mockDischargedPatients: DischargedPatient[] = []

export const mockTasks: TaskItem[] = [
  { id: "t1", title: "Verify stock levels", isCompleted: false },
  { id: "t2", title: "Review new prescriptions", isCompleted: false },
  { id: "t3", title: "Update billing records", isCompleted: true },
  { id: "t4", title: "Prepare weekly report", isCompleted: false },
]

export const mockSalesData: SalesRecord[] = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 15000 },
  { month: "Mar", revenue: 18000 },
  { month: "Apr", revenue: 16000 },
  { month: "May", revenue: 19000 },
  { month: "Jun", revenue: 22000 },
]
