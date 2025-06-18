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
  Activity,
  Building2,
} from "lucide-react"
import { mockNotifications } from "@/lib/data"
import type { NotificationItem } from "@/lib/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const sampleSalesData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 520 },
  { name: "Wed", value: 150 },
  { name: "Thu", value: 430 },
  { name: "Fri", value: 540 },
  { name: "Sat", value: 350 },
  { name: "Sun", value: 290 },
]

const salesByHospital = [
  { name: "Hospital A", value: 30 },
  { name: "Hospital B", value: 40 },
  { name: "Hospital C", value: 30 },
]

const COLORS = ["#4F46E5", "#3B82F6", "#06B6D4"]

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
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Good Morning, John Doe</h1>
          <p className="text-gray-500">Your performance summary this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
              <BarChart2 className="h-5 w-5" /> Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleSalesData}>
                <XAxis dataKey="name" stroke="#4F46E5" />
                <YAxis stroke="#4F46E5" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
              <Building2 className="h-5 w-5" /> Sales Analytics by Hospital
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByHospital}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {salesByHospital.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-green-700">
              <TrendingUp className="h-5 w-5" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map(
              (item) =>
                !item.isCompleted && (
                  <div
                    key={item.id}
                    className="p-3 rounded-md border bg-white shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                    </div>
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleCompletion(item.id)}
                      className="mt-1"
                    />
                  </div>
                ),
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-700">
            <Activity className="h-5 w-5" /> Activity (Completed)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map(
            (item) =>
              item.isCompleted && (
                <div
                  key={item.id}
                  className="p-3 rounded-md border bg-gray-100 flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold text-gray-700 line-through">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                  </div>
                  <Badge variant="secondary">Done</Badge>
                </div>
              ),
          )}
        </CardContent>
      </Card>
    </div>
  )
}
