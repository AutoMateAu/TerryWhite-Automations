"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecordPaymentForm } from "@/components/record-payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { EditDueDateDialog } from "@/components/edit-due-date-dialog"
import { EnhancedExportDialog } from "@/components/enhanced-export-dialog"
import { SendPaymentLinkDialog } from "@/components/send-payment-link-dialog"
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  FileDown,
  Link,
  CalendarDays,
  DollarSign,
  FileText,
} from "lucide-react"
import type { CustomerAccount } from "@/lib/types"

interface CustomerAccountTableProps {
  accounts: CustomerAccount[]
}

export default function CustomerAccountTable({ accounts }: CustomerAccountTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof CustomerAccount; direction: "asc" | "desc" } | null>(null)
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false)
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false)
  const [showEditDueDateDialog, setShowEditDueDateDialog] = useState(false)
  const [showEnhancedExportDialog, setShowEnhancedExportDialog] = useState(false)
  const [showSendPaymentLinkDialog, setShowSendPaymentLinkDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null)

  const filteredAccounts = accounts.filter(
    (account) =>
      account.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
    }
    return 0
  })

  const requestSort = (key: keyof CustomerAccount) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: keyof CustomerAccount) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 text-text-light" />
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent-purple rotate-180" />
    ) : (
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent-purple" />
    )
  }

  const handleRecordPaymentClick = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setShowRecordPaymentDialog(true)
  }

  const handlePaymentHistoryClick = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setShowPaymentHistoryDialog(true)
  }

  const handleEditDueDateClick = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setShowEditDueDateDialog(true)
  }

  const handleSendPaymentLinkClick = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setShowSendPaymentLinkDialog(true)
  }

  return (
    <div className="bg-bg-card rounded-lg shadow-sm border border-border-card p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold text-text-dark">Customer Accounts</h2>
        <div className="flex space-x-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-light" />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-border-card rounded-md text-sm text-text-dark focus:ring-accent-purple focus:border-accent-purple"
            />
          </div>
          <Button
            variant="outline"
            className="border-border-card text-text-medium text-sm px-3 py-1.5 hover:bg-gray-100"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            className="border-border-card text-text-medium text-sm px-3 py-1.5 hover:bg-gray-100"
            onClick={() => setShowEnhancedExportDialog(true)}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b border-border-card">
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("patientName")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  Patient Name
                  {getSortIcon("patientName")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("mrn")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  MRN
                  {getSortIcon("mrn")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("phone")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  Phone
                  {getSortIcon("phone")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("totalOwed")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  Amount Owed
                  {getSortIcon("totalOwed")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("dueDate")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  Due Date
                  {getSortIcon("dueDate")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                <Button
                  variant="ghost"
                  onClick={() => requestSort("status")}
                  className="p-0 h-auto text-xs font-medium text-text-medium hover:bg-transparent"
                >
                  Status
                  {getSortIcon("status")}
                </Button>
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-xs font-medium text-text-medium uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.length > 0 ? (
              sortedAccounts.map((account) => (
                <TableRow key={account.id} className="border-b border-border-card last:border-b-0 hover:bg-gray-50">
                  <TableCell className="py-3 px-4 text-sm font-medium text-text-dark">{account.patientName}</TableCell>
                  <TableCell className="py-3 px-4 text-sm text-text-medium">{account.mrn}</TableCell>
                  <TableCell className="py-3 px-4 text-sm text-text-medium">{account.phone}</TableCell>
                  <TableCell className="py-3 px-4 text-sm font-semibold text-text-dark">
                    ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-text-medium">{account.dueDate}</TableCell>
                  <TableCell className="py-3 px-4 text-sm">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.status === "overdue"
                          ? "bg-red-100 text-status-overdue"
                          : account.status === "current"
                            ? "bg-green-100 text-status-current"
                            : "bg-gray-100 text-text-medium"
                      }`}
                    >
                      {account.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-text-medium hover:bg-gray-100">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-bg-card border border-border-card text-text-dark">
                        <DropdownMenuItem
                          onClick={() => handleRecordPaymentClick(account)}
                          className="text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePaymentHistoryClick(account)}
                          className="text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" /> View Payment History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditDueDateClick(account)}
                          className="text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" /> Edit Due Date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendPaymentLinkClick(account)}
                          className="text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <Link className="mr-2 h-4 w-4" /> Send Payment Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-text-medium text-sm">
                  No accounts found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
        <DialogContent className="max-w-md bg-bg-card text-text-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-dark">Record Payment</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <RecordPaymentForm account={selectedAccount} onClose={() => setShowRecordPaymentDialog(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-card text-text-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-dark">Payment History</DialogTitle>
          </DialogHeader>
          {selectedAccount && <PaymentHistory accountId={selectedAccount.id} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDueDateDialog} onOpenChange={setShowEditDueDateDialog}>
        <DialogContent className="max-w-md bg-bg-card text-text-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-dark">Edit Due Date</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <EditDueDateDialog account={selectedAccount} onClose={() => setShowEditDueDateDialog(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEnhancedExportDialog} onOpenChange={setShowEnhancedExportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-card text-text-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-dark">Enhanced Export Options</DialogTitle>
          </DialogHeader>
          <EnhancedExportDialog onClose={() => setShowEnhancedExportDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showSendPaymentLinkDialog} onOpenChange={setShowSendPaymentLinkDialog}>
        <DialogContent className="max-w-md bg-bg-card text-text-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-dark">Send Payment Link</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <SendPaymentLinkDialog account={selectedAccount} onClose={() => setShowSendPaymentLinkDialog(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
