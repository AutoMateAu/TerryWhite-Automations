"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Hospital, Home, DollarSign, Calendar, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog"
import type { CustomerAccount } from "@/lib/types"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"

interface AccountingOverviewProps {
  accounts: CustomerAccount[]
}

export default function AccountingOverview({ accounts }: AccountingOverviewProps) {
  const [showBulkExportDialog, setShowBulkExportDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overdue") // State for active tab

  const overdueAccounts = accounts.filter((account) => account.status === "overdue")
  const totalOverdueAmount = overdueAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0)

  const currentAccounts = accounts.filter((account) => account.status === "current")
  const totalCurrentAmount = currentAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0)

  const totalOutstanding = accounts.reduce((sum, acc) => (acc.status !== "paid" ? sum + acc.totalOwed : sum), 0)

  const outstandingInPatients = accounts.filter(
    (account) => account.status !== "paid" && account.patientType === "in-patient",
  )
  const outstandingOutPatients = accounts.filter(
    (account) => account.status !== "paid" && account.patientType === "out-patient",
  )

  // Mock data for charts - adjusted to match the image's scale and line chart type
  // Using more generic dates for "last month"
  const amountFluctuationsData = [
    { name: "Day 1", value: 3500 },
    { name: "Day 7", value: 7000 },
    { name: "Day 14", value: 5000 },
    { name: "Day 21", value: 9000 },
    { name: "Day 28", value: 6000 },
    { name: "Day 30", value: 10000 },
  ]

  const revenueFluctuationsData = [
    { name: "Day 1", value: 7500 },
    { name: "Day 7", value: 15000 },
    { name: "Day 14", value: 10000 },
    { name: "Day 21", value: 20000 },
    { name: "Day 28", value: 12000 },
    { name: "Day 30", value: 25000 },
  ]

  // Data for the top "Gross volume" chart, styled like the reference image
  const grossVolumeChartData = [
    { name: "Jun 12", value1: 1000, value2: 1200 },
    { name: "Jun 13", value1: 1500, value2: 1700 },
    { name: "Jun 14", value1: 1300, value2: 1500 },
    { name: "Jun 15", value1: 1800, value2: 2000 },
    { name: "Jun 16", value1: 1600, value2: 1800 },
    { name: "Jun 17", value1: 2000, value2: 2200 },
    { name: "Today", value1: 1900, value2: 2100 },
  ]

  // Sample data for recent payments
  const recentPayments = [
    { id: "p1", patientName: "Alice Smith", amount: 150.0, date: "2024-06-20", type: "Card" },
    { id: "p2", patientName: "Bob Johnson", amount: 75.5, date: "2024-06-19", type: "Bank Transfer" },
    { id: "p3", patientName: "Charlie Brown", amount: 300.0, date: "2024-06-18", type: "Cash" },
    { id: "p4", patientName: "Diana Prince", amount: 120.0, date: "2024-06-17", type: "Card" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overdue":
        return (
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-text-dark text-base font-semibold">
                <FileText className="h-4 w-4 text-accent-purple" /> Overdue Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {overdueAccounts.length > 0 ? (
                overdueAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-text-dark">{account.patientName}</p>
                      <p className="text-xs text-text-medium">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-status-overdue">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-accent-purple">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-medium text-sm">No overdue accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "total-outstanding":
        return (
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-text-dark text-base font-semibold">
                <DollarSign className="h-4 w-4 text-accent-purple" /> Total Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {accounts.filter((acc) => acc.totalOwed > 0).length > 0 ? (
                accounts
                  .filter((acc) => acc.totalOwed > 0)
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-text-dark">{account.patientName}</p>
                        <p className="text-xs text-text-medium">
                          {account.hospitalName || "N/A"}
                          {account.daysOutstanding && (
                            <span className="ml-1 text-status-overdue">({account.daysOutstanding} days)</span>
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-accent-purple">
                        ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-center text-text-medium text-sm">No outstanding accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "current":
        return (
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-text-dark text-base font-semibold">
                <Calendar className="h-4 w-4 text-accent-purple" /> Current Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {currentAccounts.length > 0 ? (
                currentAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-text-dark">{account.patientName}</p>
                      <p className="text-xs text-text-medium">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-status-overdue">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-accent-purple">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-medium text-sm">No current accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "in-patient":
        return (
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-text-dark text-base font-semibold">
                <Hospital className="h-4 w-4 text-accent-purple" /> In-patient Accounts
              </CardTitle>
              <p className="text-xs text-text-medium">Patients currently admitted</p>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {outstandingInPatients.length > 0 ? (
                outstandingInPatients.map((account) => (
                  <div key={account.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-text-dark">{account.patientName}</p>
                      <p className="text-xs text-text-medium">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-status-overdue">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-accent-purple">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-medium text-sm">No outstanding in-patient accounts.</p>
              )}
            </CardContent>
          </Card>
        )
      case "out-patient":
        return (
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="flex items-center gap-2 text-text-dark text-base font-semibold">
                <Home className="h-4 w-4 text-accent-purple" /> Out-patient Accounts
              </CardTitle>
              <p className="text-xs text-text-medium">Patients not currently admitted</p>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {outstandingOutPatients.length > 0 ? (
                outstandingOutPatients.map((account) => (
                  <div key={account.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-text-dark">{account.patientName}</p>
                      <p className="text-xs text-text-medium">
                        {account.daysOutstanding && (
                          <span className="text-status-overdue">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="font-bold text-accent-purple">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-medium text-sm">No outstanding out-patient accounts.</p>
              )}
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-bg-page text-text-dark">
      {/* Top Section: Today Overview */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-6 text-text-dark">Today</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gross Volume Chart (Revenue Fluctuations, styled like image) */}
          <Card className="lg:col-span-3 rounded-lg shadow-sm border border-border-card bg-bg-card p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-text-medium mb-4">Gross volume</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={grossVolumeChartData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#909090", fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide /> {/* Hidden Y-axis as per image */}
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "4px" }}
                      itemStyle={{ color: "#1A1A1A", fontSize: "12px" }}
                      labelStyle={{ color: "#606060", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value1"
                      stroke="#606060"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: "#606060" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value2"
                      stroke="#A0A0A0"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: "#A0A0A0" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex justify-between items-end mt-4 text-text-dark">
              <div>
                <p className="text-sm text-text-medium">AUD balance</p>
                <p className="text-lg font-semibold">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-text-medium">Payouts</p>
                <p className="text-lg font-semibold">$0.00</p>
              </div>
            </div>
          </Card>

          {/* Recommendations & API Keys Card */}
        </div>
      </div>

      {/* Middle Section: Your Overview */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-dark">Your overview</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="border-border-card text-text-medium text-xs px-3 py-1.5 hover:bg-accent-purple hover:text-white"
            >
              <Plus className="h-3 w-3 mr-1.5 text-accent-purple" /> Add
            </Button>
            <Button
              variant="outline"
              className="border-border-card text-text-medium text-xs px-3 py-1.5 hover:bg-accent-purple hover:text-white"
            >
              <Settings className="h-3 w-3 mr-1.5 text-accent-purple" /> Edit
            </Button>
          </div>
        </div>

        {/* Payments Section */}
        <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6 mb-6">
          <h3 className="text-base font-semibold text-text-dark mb-4">Recent Payments</h3>
          <div className="space-y-4">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent-purple/10 text-accent-purple">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-text-dark">{payment.patientName}</p>
                      <p className="text-xs text-text-medium">
                        {payment.type} - {payment.date}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-text-dark">
                    ${payment.amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-text-medium text-sm">No recent payments found.</p>
            )}
          </div>
        </Card>

        {/* Gross Volume & Net Volume from Sales Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-semibold text-text-dark flex items-center">
                Gross volume <span className="ml-2 text-xs font-normal text-status-current">0.0%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xl font-bold text-text-dark">$0.00</p>
              <p className="text-xs text-text-medium">$0.00 previous period</p>
              <div className="h-24 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={amountFluctuationsData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Line type="monotone" dataKey="value" stroke="#6A0DAD" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-xs text-text-medium mt-2">
                <span>Jun 12</span>
                <span>Today</span>
              </div>
              <a href="#" className="text-accent-purple text-xs font-medium mt-2 block">
                View more
              </a>
              <p className="text-xs text-text-light mt-1">Updated 6:16 PM</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-semibold text-text-dark flex items-center">
                Net volume from sales <span className="ml-2 text-xs font-normal text-status-current">0.0%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-xl font-bold text-text-dark">$0.00</p>
              <p className="text-xs text-text-medium">$0.00 previous period</p>
              <div className="h-24 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueFluctuationsData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Line type="monotone" dataKey="value" stroke="#6A0DAD" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-xs text-text-medium mt-2">
                <span>Jun 12</span>
                <span>Today</span>
              </div>
              <a href="#" className="text-accent-purple text-xs font-medium mt-2 block">
                View more
              </a>
              <p className="text-xs text-text-light mt-1">Updated 6:16 PM</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Overdue, Amount Fluctuations (Last Month), Revenue Fluctuations (Last Month) */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Overdue Accounts Card */}
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="pb-2 p-0">
              <CardTitle className="text-sm font-semibold text-text-dark">Overdue Accounts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-status-overdue">{overdueAccounts.length}</div>
              <p className="text-xs text-text-medium">
                ${totalOverdueAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })} total
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full bg-accent-purple text-white hover:bg-accent-purple/90 border-accent-purple text-xs px-3 py-1.5"
                onClick={() => setShowBulkExportDialog(true)}
                disabled={overdueAccounts.length === 0}
              >
                <FileText className="h-3 w-3 mr-1.5" />
                Generate Overdue Report
              </Button>
            </CardContent>
          </Card>

          {/* Amount Fluctuations (Last Month) Chart Card */}
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-semibold text-text-dark">Amount Fluctuations (Last Month)</CardTitle>
              <p className="text-xs text-text-medium">Overview of total outstanding amounts</p>
            </CardHeader>
            <CardContent className="h-48 p-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={amountFluctuationsData}>
                  <XAxis
                    dataKey="name"
                    stroke="#A0A0A0"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: "10px" }}
                  />
                  <YAxis stroke="#A0A0A0" tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "4px" }}
                    itemStyle={{ color: "#1A1A1A", fontSize: "12px" }}
                    labelStyle={{ color: "#6A0DAD", fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6A0DAD" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Fluctuations (Last Month) Chart Card */}
          <Card className="rounded-lg shadow-sm border border-border-card bg-bg-card p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-semibold text-text-dark">
                Revenue Fluctuations (Last Month)
              </CardTitle>
              <p className="text-xs text-text-medium">Overview of total revenue generated</p>
            </CardHeader>
            <CardContent className="h-48 p-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueFluctuationsData}>
                  <XAxis
                    dataKey="name"
                    stroke="#A0A0A0"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: "10px" }}
                  />
                  <YAxis stroke="#A0A0A0" tickLine={false} axisLine={false} style={{ fontSize: "10px" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "4px" }}
                    itemStyle={{ color: "#1A1A1A", fontSize: "12px" }}
                    labelStyle={{ color: "#6A0DAD", fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6A0DAD" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab-like navigation (retained and restyled) */}
      <div className="flex space-x-2 mb-6 border-b border-border-card pb-2">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("overdue")}
          className={`text-text-dark text-sm font-medium px-4 py-2 rounded-md ${
            activeTab === "overdue"
              ? "border-b-2 border-accent-purple text-accent-purple"
              : "hover:bg-accent-purple hover:text-white"
          }`}
        >
          Overdue Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("total-outstanding")}
          className={`text-text-dark text-sm font-medium px-4 py-2 rounded-md ${
            activeTab === "total-outstanding"
              ? "border-b-2 border-accent-purple text-accent-purple"
              : "hover:bg-accent-purple hover:text-white"
          }`}
        >
          Total Outstanding
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("current")}
          className={`text-text-dark text-sm font-medium px-4 py-2 rounded-md ${
            activeTab === "current"
              ? "border-b-2 border-accent-purple text-accent-purple"
              : "hover:bg-accent-purple hover:text-white"
          }`}
        >
          Current Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("in-patient")}
          className={`text-text-dark text-sm font-medium px-4 py-2 rounded-md ${
            activeTab === "in-patient"
              ? "border-b-2 border-accent-purple text-accent-purple"
              : "hover:bg-accent-purple hover:text-white"
          }`}
        >
          In-patient Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("out-patient")}
          className={`text-text-dark text-sm font-medium px-4 py-2 rounded-md ${
            activeTab === "out-patient"
              ? "border-b-2 border-accent-purple text-accent-purple"
              : "hover:bg-accent-purple hover:text-white"
          }`}
        >
          Out-patient Accounts
        </Button>
      </div>

      {/* Content based on active tab (retained and restyled) */}
      <div className="mb-8">{renderTabContent()}</div>

      <Dialog open={showBulkExportDialog} onOpenChange={setShowBulkExportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-card text-text-dark">
          <BulkPDFExportDialog
            accounts={accounts}
            reportType="overdue"
            onClose={() => setShowBulkExportDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
