import type { PatientProfile, NotificationItem, CustomerAccount } from "./types"

// Mock data for notifications and customer accounts (if DB tables don't exist)
export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "reminder",
    title: "Refill Statins for Mr. Johnson",
    content: "Order due by end of day.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
    isCompleted: false,
    href: "/patients/1", // Example: Link to patient profile
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: "n2",
    type: "message",
    title: "New prescription for Alice Brown",
    content: "Dr. Emily Carter sent a new e-prescription. Please review.",
    isCompleted: false,
    href: "/patients/2", // Example: Link to patient profile
    timestamp: new Date().toISOString(),
  },
  {
    id: "n3",
    type: "reminder",
    title: "Check Warfarin INR for Mrs. Davis",
    content: "Scheduled for today.",
    dueDate: new Date().toISOString().split("T")[0],
    isCompleted: true,
    href: "/patients/3", // Example: Link to patient profile (even if completed)
    timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
  },
  {
    id: "n4",
    type: "alert",
    title: "Overdue Account: Robert Johnson",
    content: "Account ACC003 is 30 days overdue.",
    isCompleted: false,
    href: "/accounts/acc3", // Example: Link to accounting page for this account
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
  },
  {
    id: "n5",
    type: "reminder",
    title: "Discharge Summary for Michael Wilson",
    content: "Summary needs final review before sending.",
    isCompleted: false,
    href: "/discharge", // Example: Link to discharge page
    timestamp: new Date().toISOString(),
  },
]

// Mock data for customer accounts (used only if DB tables are not set up)
export const mockCustomerAccounts: CustomerAccount[] = [
  {
    id: "acc1",
    patientId: "1",
    patientName: "John Doe",
    mrn: "MRN001",
    phone: "0412 345 678",
    totalOwed: 245.5,
    lastPaymentDate: "2024-01-15",
    lastPaymentAmount: 100.0,
    dischargeFormIds: [],
    status: "current",
    createdAt: "2024-01-01T00:00:00Z",
    dueDate: "2024-02-14",
  },
  {
    id: "acc2",
    patientId: "2",
    patientName: "Jane Smith",
    mrn: "MRN002",
    phone: "0498 765 432",
    totalOwed: 89.25,
    lastPaymentDate: "2024-01-20",
    lastPaymentAmount: 50.0,
    dischargeFormIds: [],
    status: "current",
    createdAt: "2024-01-05T00:00:00Z",
    dueDate: "2024-02-19",
  },
  {
    id: "acc3",
    patientId: "3",
    patientName: "Robert Johnson",
    mrn: "MRN003",
    phone: "(02) 9876 5432",
    totalOwed: 567.8,
    lastPaymentDate: "2023-11-10",
    lastPaymentAmount: 25.0,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: "2023-10-15T00:00:00Z",
    dueDate: "2023-12-10",
  },
  {
    id: "acc4",
    patientId: "4",
    patientName: "Emily Davis",
    mrn: "MRN004",
    phone: "0423 109 876",
    totalOwed: 0.0,
    lastPaymentDate: "2024-01-25",
    lastPaymentAmount: 156.75,
    dischargeFormIds: [],
    status: "paid",
    createdAt: "2024-01-10T00:00:00Z",
    dueDate: "2024-02-24",
  },
  {
    id: "acc5",
    patientId: "5",
    patientName: "Michael Wilson",
    mrn: "MRN005",
    phone: "(03) 8765 4321",
    totalOwed: 423.15,
    lastPaymentDate: "2023-10-30",
    lastPaymentAmount: 75.0,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: "2023-09-20T00:00:00Z",
    dueDate: "2023-11-29",
  },
  {
    id: "acc6",
    patientId: "6",
    patientName: "Sarah Connor",
    mrn: "MRN006",
    phone: "0456 789 012",
    totalOwed: 125.0,
    lastPaymentDate: null,
    lastPaymentAmount: null,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days ago
  },
]

// Mock data for patients (used only if DB tables are not set up)
export const mockPatients: PatientProfile[] = [
  {
    id: "1",
    name: "John Doe",
    dob: "1985-07-12",
    address: "123 Main St, Anytown, NSW",
    medicare: "1234567890",
    allergies: "Penicillin, Peanuts",
    mrn: "MRN001",
    phone: "0412 345 678",
  },
  {
    id: "2",
    name: "Jane Smith",
    dob: "1992-03-25",
    address: "456 Oak Ave, Anytown, VIC",
    medicare: "0987654321",
    allergies: "None known",
    mrn: "MRN002",
    phone: "0498 765 432",
  },
  {
    id: "3",
    name: "Robert Johnson",
    dob: "1970-01-01",
    address: "789 Pine St, Anytown, QLD",
    medicare: "1122334455",
    allergies: "Aspirin",
    mrn: "MRN003",
    phone: "(02) 9876 5432",
  },
]

// mockDischargedPatients is no longer needed as data will come from DB
// export const mockDischargedPatients: DischargedPatient[] = []
