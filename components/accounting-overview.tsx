"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"

const sampleRevenueData = [
  { name: "Mon", value: 250 },
  { name: "Tue", value: 400 },
  { name: "Wed", value: 300 },
  { name: "Thu", value: 500 },
  { name: "Fri", value: 600 },
  { name: "Sat", value: 200 },
  { name: "Sun", value: 350 },
]

const overduePieData = [
  { name: "Hospital A", value: 40 },
  { name: "Hospital B", value: 30 },
  { name: "Hospital C", value: 30 },
]

const COLORS = ["#6366F1", "#3B82F6", "#06B6D4"]

export default function AccountingOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50 py-10 px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800">Accounting Dashboard</h1>
        <p className="text-gray-500">Real-time patient billing insights and overdue monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$1,450.70</div>
            <p className="text-sm">Across 5 accounts</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm">$1,450.70 total</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm">$0.00 total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700 text-xl">
              <DollarSign className="h-5 w-5" /> Revenue This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleRevenueData}>
                <XAxis dataKey="name" stroke="#4F46E5" />
                <YAxis stroke="#4F46E5" />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 text-xl">
              <Calendar className="h-5 w-5" /> Overdue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={overduePieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {overduePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
