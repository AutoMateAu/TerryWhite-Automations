"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Hospital, Home, DollarSign, Calendar } from "lucide-react"
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
  const amountFluctuationsData = [
    { name: "12 June", value: 3500 },
    { name: "13 June", value: 7000 },
    { name: "14 June", value: 5000 },
    { name: "15 June", value: 9000 },
    { name: "16 June", value: 6000 },
    { name: "17 June", value: 10000 },
    { name: "18 June", value: 8000 },
  ]

  const revenueFluctuationsData = [
    { name: "12 June", value: 7500 },
    { name: "13 June", value: 15000 },
    { name: "14 June", value: 10000 },
    { name: "15 June", value: 20000 },
    { name: "16 June", value: 12000 },
    { name: "17 June", value: 25000 },
    { name: "18 June", value: 18000 },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overdue":
        return (
          <Card className="rounded-xl shadow-md border border-violet-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-purple text-lg font-semibold">
                <FileText className="h-5 w-5 text-violet-highlight" /> Overdue Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueAccounts.length > 0 ? (
                overdueAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-dark">{account.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-light-pink">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-violet-highlight">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No overdue accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "total-outstanding":
        return (
          <Card className="rounded-xl shadow-md border border-violet-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-purple text-lg font-semibold">
                <DollarSign className="h-5 w-5 text-violet-highlight" /> Total Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.filter((acc) => acc.totalOwed > 0).length > 0 ? (
                accounts
                  .filter((acc) => acc.totalOwed > 0)
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-dark">{account.patientName}</p>
                        <p className="text-xs text-gray-500">
                          {account.hospitalName || "N/A"}
                          {account.daysOutstanding && (
                            <span className="ml-1 text-light-pink">({account.daysOutstanding} days)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-violet-highlight">
                        ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No outstanding accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "current":
        return (
          <Card className="rounded-xl shadow-md border border-violet-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-purple text-lg font-semibold">
                <Calendar className="h-5 w-5 text-violet-highlight" /> Current Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentAccounts.length > 0 ? (
                currentAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-dark">{account.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-light-pink">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-violet-highlight">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No current accounts found.</p>
              )}
            </CardContent>
          </Card>
        )
      case "in-patient":
        return (
          <Card className="rounded-xl shadow-md border border-violet-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-purple text-lg font-semibold">
                <Hospital className="h-5 w-5 text-violet-highlight" /> In-patient Accounts
              </CardTitle>
              <p className="text-sm text-gray-500">Patients currently admitted</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {outstandingInPatients.length > 0 ? (
                outstandingInPatients.map((account) => (
                  <div key={account.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-dark">{account.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {account.hospitalName || "N/A"}
                        {account.daysOutstanding && (
                          <span className="ml-1 text-light-pink">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-violet-highlight">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No outstanding in-patient accounts.</p>
              )}
            </CardContent>
          </Card>
        )
      case "out-patient":
        return (
          <Card className="rounded-xl shadow-md border border-violet-highlight">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-deep-purple text-lg font-semibold">
                <Home className="h-5 w-5 text-violet-highlight" /> Out-patient Accounts
              </CardTitle>
              <p className="text-sm text-gray-500">Patients not currently admitted</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {outstandingOutPatients.length > 0 ? (
                outstandingOutPatients.map((account) => (
                  <div key={account.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-dark">{account.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {account.daysOutstanding && (
                          <span className="text-light-pink">({account.daysOutstanding} days)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-violet-highlight">
                      ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm">No outstanding out-patient accounts.</p>
              )}
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 bg-soft-offwhite">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-dark">Accounting Dashboard</h1>
        <p className="text-base text-gray-500">Real-time patient billing insights and overdue monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-xl shadow-md border border-violet-highlight">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-deep-purple">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-highlight">
              ${totalOutstanding.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-500">
              Across {accounts.filter((acc) => acc.totalOwed > 0).length} accounts
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md border border-violet-highlight">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-deep-purple">Overdue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-pink">{overdueAccounts.length}</div>
            <p className="text-sm text-gray-500">
              ${totalOverdueAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })} total
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full bg-violet-highlight text-white hover:bg-deep-purple hover:text-white transition-colors underline"
              onClick={() => setShowBulkExportDialog(true)}
              disabled={overdueAccounts.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Overdue Report
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md border border-violet-highlight">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-deep-purple">Current Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-highlight">{currentAccounts.length}</div>
            <p className="text-sm text-gray-500">
              ${totalCurrentAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="rounded-xl shadow-md border border-violet-highlight">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-deep-purple">Amount Fluctuations (Past Week)</CardTitle>
            <p className="text-sm text-gray-500">Overview of total outstanding amounts</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={amountFluctuationsData}>
                <XAxis dataKey="name" stroke="#8E24AA" />
                <YAxis stroke="#8E24AA" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8E24AA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md border border-violet-highlight">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-deep-purple">Revenue Fluctuations (Past Week)</CardTitle>
            <p className="text-sm text-gray-500">Overview of total revenue generated</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueFluctuationsData}>
                <XAxis dataKey="name" stroke="#8E24AA" />
                <YAxis stroke="#8E24AA" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8E24AA" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tab-like navigation */}
      <div className="flex space-x-2 mb-6 border-b border-light-pink pb-2">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("overdue")}
          className={`text-deep-purple font-semibold ${
            activeTab === "overdue" ? "border-b-2 border-violet-highlight" : ""
          }`}
        >
          Overdue Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("total-outstanding")}
          className={`text-deep-purple font-semibold ${
            activeTab === "total-outstanding" ? "border-b-2 border-violet-highlight" : ""
          }`}
        >
          Total Outstanding
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("current")}
          className={`text-deep-purple font-semibold ${
            activeTab === "current" ? "border-b-2 border-violet-highlight" : ""
          }`}
        >
          Current Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("in-patient")}
          className={`text-deep-purple font-semibold ${
            activeTab === "in-patient" ? "border-b-2 border-violet-highlight" : ""
          }`}
        >
          In-patient Accounts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("out-patient")}
          className={`text-deep-purple font-semibold ${
            activeTab === "out-patient" ? "border-b-2 border-violet-highlight" : ""
          }`}
        >
          Out-patient Accounts
        </Button>
      </div>

      {/* Content based on active tab */}
      <div className="mb-8">{renderTabContent()}</div>

      <Dialog open={showBulkExportDialog} onOpenChange={setShowBulkExportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
