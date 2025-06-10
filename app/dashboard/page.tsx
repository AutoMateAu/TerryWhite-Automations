"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  CalendarCheck,
  AlertTriangle,
  BarChart2,
  TrendingUp,
} from "lucide-react"
import { mockNotifications } from "@/lib/data"
import type { NotificationItem } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const sampleChartData = [
  { name: "Jan", value: 30 },
  { name: "Feb", value: 45 },
  { name: "Mar", value: 35 },
  { name: "Apr", value: 60 },
  { name: "May", value: 75 },
  { name: "Jun", value: 90 },
]

export default function DashboardPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    setNotifications(
      mockNotifications.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    )
  }, [])

  const toggleCompletion = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isCompleted: !n.isCompleted } : n)),
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-6">
      <h1 className="text-4xl font-bold mb-10 text-indigo-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        <Card className="shadow-xl rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
              <BarChart2 className="h-5 w-5" /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleChartData}>
                <XAxis dataKey="name" stroke="#4F46E5" />
                <YAxis stroke="#4F46E5" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl bg-white col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-green-700">
              <TrendingUp className="h-5 w-5" /> Tasks & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between rounded-lg p-4 border ${
                  item.isCompleted ? "bg-gray-100 opacity-70" : "bg-green-50"
                }`}
              >
                <div className="flex gap-3 items-start">
                  {item.type === "message" ? (
                    <MessageSquare className="text-blue-500 h-5 w-5 mt-1" />
                  ) : (
                    <CalendarCheck className="text-green-500 h-5 w-5 mt-1" />
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.type === "reminder" && item.dueDate && !item.isCompleted && new Date(item.dueDate) < new Date() && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`complete-${item.id}`}
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleCompletion(item.id)}
                    />
                    <label htmlFor={`complete-${item.id}`} className="text-sm text-gray-700">
                      Done
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
