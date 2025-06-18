"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BellIcon, DollarSign, Users, Clock } from "lucide-react"
import { getRecentPayments, getOutstandingAccounts, getPatients } from "@/services/accounting-service"
import type { Payment, CustomerAccount, PatientProfile } from "@/lib/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [outstandingAccounts, setOutstandingAccounts] = useState<CustomerAccount[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])

  // Mock notifications for "Your Tasks"
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "reminder",
      message: "Follow up with John Doe regarding medication refill.",
      dueDate: "2025-06-20",
      completed: false,
    },
    {
      id: "2",
      type: "alert",
      message: "New patient registration requires review.",
      dueDate: "2025-06-15",
      completed: false,
    },
    {
      id: "3",
      type: "message",
      message: "Team meeting at 10 AM in conference room B.",
      dueDate: "2025-06-18",
      completed: true,
    },
    {
      id: "4",
      type: "reminder",
      message: "Prepare discharge forms for patient Jane Smith.",
      dueDate: "2025-06-10",
      completed: false,
    },
  ])

  useEffect(() => {
    async function fetchData() {
      try {
        const payments = await getRecentPayments(5)
        setRecentPayments(payments)

        const outstanding = await getOutstandingAccounts()
        setOutstandingAccounts(outstanding)

        const patientsData = await getPatients()
        setPatients(patientsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    }
    fetchData()
  }, [])

  const overdueTasks = notifications.filter((task) => !task.completed && new Date(task.dueDate) < new Date())

  return (
    <div className="flex flex-col min-h-screen bg-soft-offwhite p-8 font-sans">
      <header className="mb-10 animate-fade-in-up">
        <h1 className="text-5xl font-bold text-deep-purple mb-2">Dashboard</h1>
        <p className="text-lg font-medium text-slate-dark">Overview of your pharmacy operations.</p>
      </header>
      <main className="flex-1 grid grid-cols-1 gap-8">
        {/* Quick Stats - Now full width and thin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-fade-in-up delay-100 bg-white shadow-lg rounded-xl h-[100px] flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-violet-highlight" />
              <div>
                <CardTitle className="text-xl font-semibold text-deep-purple">Total Patients</CardTitle>
                <div className="text-3xl font-bold text-slate-dark">{patients.length}</div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 hidden md:block">Registered patients</p>
          </Card>

          <Card className="animate-fade-in-up delay-200 bg-white shadow-lg rounded-xl h-[100px] flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-violet-highlight" />
              <div>
                <CardTitle className="text-xl font-semibold text-deep-purple">Outstanding Balance</CardTitle>
                <div className="text-3xl font-bold text-slate-dark">
                  ${outstandingAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 hidden md:block">Total amount owed</p>
          </Card>

          <Card className="animate-fade-in-up delay-300 bg-white shadow-lg rounded-xl h-[100px] flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-violet-highlight" />
              <div>
                <CardTitle className="text-xl font-semibold text-deep-purple">Overdue Tasks</CardTitle>
                <div className="text-3xl font-bold text-slate-dark">{overdueTasks.length}</div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 hidden md:block">Tasks past due date</p>
          </Card>
        </div>

        {/* Your Tasks */}
        <Card className="animate-fade-in-up delay-400 bg-white shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-2xl font-semibold text-deep-purple">Your Tasks</CardTitle>
            <Button variant="ghost" className="text-violet-highlight underline">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ul className="space-y-6">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <BellIcon className="h-6 w-6 text-light-pink" />
                      <div>
                        <p className="text-lg font-semibold text-slate-dark">{notification.message}</p>
                        <p className="text-sm font-medium text-gray-500">Due: {notification.dueDate}</p>
                      </div>
                    </div>
                    <Badge
                      variant={notification.completed ? "secondary" : "default"}
                      className={`font-medium ${
                        notification.completed ? "bg-green-100 text-green-800" : "bg-light-pink text-deep-purple"
                      }`}
                    >
                      {notification.completed ? "Completed" : notification.type}
                    </Badge>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-500 font-medium p-4">No tasks to display.</p>
              )}
            </ul>
          </CardContent>
        </Card>
        {/* Recent Payments */}
        <Card className="animate-fade-in-up delay-500 bg-white shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-2xl font-semibold text-deep-purple">Recent Payments</CardTitle>
            <Link href="/accounting" className="text-violet-highlight underline font-medium">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ul className="space-y-6">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                  >
                    <div>
                      <p className="text-lg font-semibold text-slate-dark">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm font-medium text-gray-500">
                        {payment.patientName} ({payment.mrn})
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-500 font-medium p-4">No recent payments.</p>
              )}
            </ul>
          </CardContent>
        </Card>
        {/* Outstanding Tasks */}
        {overdueTasks.length > 0 && (
          <Card className="animate-fade-in-up delay-600 bg-white shadow-lg rounded-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl font-semibold text-deep-purple flex items-center gap-4">
                <Clock className="h-7 w-7 text-red-500" />
                Outstanding Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ul className="space-y-6">
                {overdueTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg transition-all duration-300 hover:bg-red-100"
                  >
                    <div className="flex items-center gap-4">
                      <BellIcon className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="text-lg font-semibold text-slate-dark">{task.message}</p>
                        <p className="text-sm font-medium text-red-600">Overdue since: {task.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="bg-red-500 text-white font-medium">
                      Overdue
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* Outstanding Accounts */}
        <Card className="animate-fade-in-up delay-700 bg-white shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-2xl font-semibold text-deep-purple">Outstanding Accounts</CardTitle>
            <Link href="/accounting" className="text-violet-highlight underline font-medium">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ul className="space-y-6">
              {outstandingAccounts.length > 0 ? (
                outstandingAccounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                  >
                    <div>
                      <p className="text-lg font-semibold text-slate-dark">
                        {account.patientName} - ${account.totalOwed.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium text-gray-500">
                        {account.hospitalId ? `Hospital: ${account.hospitalId}` : "Hospital: N/A"}
                        {" | "}
                        Outstanding for: {account.daysOutstanding} days
                      </p>
                    </div>
                    <Badge
                      variant={account.status === "overdue" ? "destructive" : "default"}
                      className={`font-medium ${
                        account.status === "overdue" ? "bg-red-500 text-white" : "bg-light-pink text-deep-purple"
                      }`}
                    >
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </Badge>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-500 font-medium p-4">No outstanding accounts.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </main>

    </div>
  )
}
