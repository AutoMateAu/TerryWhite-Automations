import type { PatientProfile, NotificationItem, DischargedPatient, CustomerAccount } from "./types"

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
    currentMedications: [
      { name: "Lisinopril 10mg", dosage: "1 tablet", frequency: "Once daily" },
      { name: "Metformin 500mg", dosage: "1 tablet", frequency: "Twice daily" },
    ],
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

export const mockCustomerAccounts: CustomerAccount[] = [
  {
    id: "acc1",
    patientId: "1",
    patientName: "John Doe",
    mrn: "MRN001",
    phone: "0412 345 678",
    totalOwed: 245.5,
    lastPaymentDate: "2024-01-15", // Recent payment, should be current
    lastPaymentAmount: 100.0,
    dischargeFormIds: [],
    status: "current",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "acc2",
    patientId: "2",
    patientName: "Jane Smith",
    mrn: "MRN002",
    phone: "0498 765 432",
    totalOwed: 89.25,
    lastPaymentDate: "2024-01-20", // Recent payment, should be current
    lastPaymentAmount: 50.0,
    dischargeFormIds: [],
    status: "current",
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "acc3",
    patientId: "3",
    patientName: "Robert Johnson",
    mrn: "MRN003",
    phone: "(02) 9876 5432",
    totalOwed: 567.8,
    lastPaymentDate: "2023-11-10", // Old payment, should be overdue
    lastPaymentAmount: 25.0,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: "2023-10-15T00:00:00Z",
  },
  {
    id: "acc4",
    patientId: "4",
    patientName: "Emily Davis",
    mrn: "MRN004",
    phone: "0423 109 876",
    totalOwed: 0.0, // No balance, should be paid
    lastPaymentDate: "2024-01-25",
    lastPaymentAmount: 156.75,
    dischargeFormIds: [],
    status: "paid",
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "acc5",
    patientId: "5",
    patientName: "Michael Wilson",
    mrn: "MRN005",
    phone: "(03) 8765 4321",
    totalOwed: 423.15,
    lastPaymentDate: "2023-10-30", // Very old payment, should be overdue
    lastPaymentAmount: 75.0,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: "2023-09-20T00:00:00Z",
  },
  {
    id: "acc6",
    patientId: "6",
    patientName: "Sarah Connor",
    mrn: "MRN006",
    phone: "0456 789 012",
    totalOwed: 125.0,
    lastPaymentDate: undefined, // No payments, created 45 days ago, should be overdue
    lastPaymentAmount: undefined,
    dischargeFormIds: [],
    status: "overdue",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
  },
]
