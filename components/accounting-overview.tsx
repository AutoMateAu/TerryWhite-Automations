"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Hospital, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { BulkPDFExportDialog } from "@/components/bulk-pdf-export-dialog"
import type { CustomerAccount } from "@/lib/types"

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

  const outstandingInPatients = accounts.filter(
    (account) => account.status !== "paid" && account.patientType === "in-patient",
  )
  const outstandingOutPatients = accounts.filter(
    (account) => account.status !== "paid" && account.patientType === "out-patient",
  )

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 bg-soft-offwhite">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-dark">Accounting Dashboard</h1>
        <p className="text-base text-gray-500">Real-time patient billing insights and overdue monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-xl shadow-md">
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

        <Card className="rounded-xl shadow-md">
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
              className="mt-4 w-full bg-violet-highlight text-white hover:bg-deep-purple"
              onClick={() => setShowBulkExportDialog(true)}
              disabled={overdueAccounts.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Overdue Report
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-md">
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

        <Card className="rounded-xl shadow-md">
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
      </div>

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
