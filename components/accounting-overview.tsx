"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar, FileText } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Button } from "@/components/ui/button" // Import Button
import { Dialog, DialogContent } from "@/components/ui/dialog" // Import Dialog components
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog" // Import BulkPDFExportDialog
import type { CustomerAccount } from "@/lib/types" // Import CustomerAccount type

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

interface AccountingOverviewProps {
  accounts: CustomerAccount[]
}

export default function AccountingOverview({ accounts }: AccountingOverviewProps) {
  const [showBulkExportDialog, setShowBulkExportDialog] = useState(false)

  const overdueAccounts = accounts.filter((account) => account.status === "overdue")
  const totalOverdueAmount = overdueAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0)

  const currentAccounts = accounts.filter((account) => account.status === "current")
  const totalCurrentAmount = currentAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0)

  const totalOutstanding = accounts.reduce((sum, acc) => (acc.status !== "paid" ? sum + acc.totalOwed : sum), 0)

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
            <div className="text-3xl font-bold">
              ${totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm">Across {accounts.filter((acc) => acc.status !== "paid").length} accounts</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overdueAccounts.length}</div>
            <p className="text-sm">${totalOverdueAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })} total</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full bg-white text-red-600 hover:bg-red-50"
              onClick={() => setShowBulkExportDialog(true)}
              disabled={overdueAccounts.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Overdue Report
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentAccounts.length}</div>
            <p className="text-sm">${totalCurrentAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })} total</p>
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

      {/* Bulk PDF Export Dialog for Overdue Accounts */}
      <Dialog open={showBulkExportDialog} onOpenChange={setShowBulkExportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BulkPDFExportDialog
            accounts={accounts} // Pass all accounts, dialog will filter by reportType
            reportType="overdue"
            onClose={() => setShowBulkExportDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
