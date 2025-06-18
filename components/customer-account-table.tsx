"use client"

import { useState, useMemo } from "react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  DollarSign,
  Phone,
  FileText,
  History,
  MessageSquare,
  CalendarDays,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatAustralianPhoneNumber } from "@/utils/phone-formatter"
import { RecordPaymentForm } from "@/components/record-payment-form"
import { PaymentHistory } from "@/components/payment-history"
import { AddCallLogForm } from "@/components/add-call-log-form"
import { CallHistory } from "@/components/call-history"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { EditDueDateDialog } from "@/components/edit-due-date-dialog"
import { generatePDFFilename } from "@/lib/pdf-generator"
import { generateAccountPDF } from "@/utils/pdf-client"
import { useRouter } from "next/navigation"
import type { CustomerAccount, PDFExportOptions } from "@/lib/types"

interface CustomerAccountTableProps {
  accounts: CustomerAccount[]
}

export default function CustomerAccountTable({ accounts }: CustomerAccountTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterBalance, setFilterBalance] = useState("all")
  const [sortColumn, setSortColumn] = useState("patientName")
  const [sortDirection, setSortDirection] = useState("asc")

  const [isRecordPaymentDialogOpen, setIsRecordPaymentDialogOpen] = useState(false)
  const [isPaymentHistoryDialogOpen, setIsPaymentHistoryDialogOpen] = useState(false)
  const [isAddCallLogDialogOpen, setIsAddCallLogDialogOpen] = useState(false)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [isPDFExportDialogOpen, setIsPDFExportDialogOpen] = useState(false)
  const [isEditDueDateDialogOpen, setIsEditDueDateDialogOpen] = useState(false)

  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const filteredAndSortedAccounts = useMemo(() => {
    const filtered = accounts.filter((account) => {
      const matchesSearch =
        account.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.phone && formatAustralianPhoneNumber(account.phone).includes(searchTerm))

      const matchesStatus = filterStatus === "all" || account.status === filterStatus

      const matchesBalance =
        filterBalance === "all" ||
        (filterBalance === "zero" && account.totalOwed === 0) ||
        (filterBalance === "non-zero" && account.totalOwed > 0) ||
        (filterBalance === "overdue" && account.status === "overdue")

      return matchesSearch && matchesStatus && matchesBalance
    })

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortColumn === "patientName") {
        comparison = a.patientName.localeCompare(b.patientName)
      } else if (sortColumn === "totalOwed") {
        comparison = a.totalOwed - b.totalOwed
      } else if (sortColumn === "status") {
        const statusOrder = { current: 0, overdue: 1, paid: 2 }
        comparison = statusOrder[a.status] - statusOrder[b.status]
      } else if (sortColumn === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        comparison = dateA - dateB
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [accounts, searchTerm, filterStatus, filterBalance, sortColumn, sortDirection])

  const handleOpenRecordPayment = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsRecordPaymentDialogOpen(true)
  }

  const handleOpenPaymentHistory = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsPaymentHistoryDialogOpen(true)
  }

  const handleOpenAddCallLog = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsAddCallLogDialogOpen(true)
  }

  const handleOpenCallHistory = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsCallHistoryDialogOpen(true)
  }

  const handleOpenPDFExport = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsPDFExportDialogOpen(true)
  }

  const handleOpenEditDueDate = (account: CustomerAccount) => {
    setSelectedAccount(account)
    setIsEditDueDateDialogOpen(true)
  }

  const handleOpenSendPaymentLink = (account: CustomerAccount) => {
    const paymentLink = `https://demo.paybyweb.nab.com.au/SecureBillPayment/securebill/nab/payTemplate.vm?&bill_name=${encodeURIComponent(account.patientName)}`
    window.open(paymentLink, "_blank") // Open in a new tab
    toast({
      title: "Opening Demo Payment Link",
      description: "The example payment link has been opened in a new tab.",
    })
  }

  const handleDownloadSinglePDF = async (account: CustomerAccount) => {
    try {
      const options: PDFExportOptions = {
        includeAccountSummary: true,
        includeContactInfo: true,
        includeOutstandingBalance: true,
        includePaymentHistory: true,
        includeCallHistory: true,
        includeNotes: false,
      }
      const pdfBlob = await generateAccountPDF([account], options, "single")
      const filename = generatePDFFilename("single", account.patientName)
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Generated",
        description: `Account report for ${account.patientName} downloaded.`,
      })
    } catch (error) {
      console.error("Error generating single PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate PDF for this account.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "overdue":
        return "destructive"
      case "current":
        return "default"
      case "paid":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto px-6 mt-10 animate-fade-in-up delay-300 text-text-primary">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Customer Accounts</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px] border-border-light focus:border-accent-purple focus:ring-accent-purple text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white text-text-primary border-border-light hover:bg-gray-100 transition-colors text-sm px-3 py-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-border-light text-text-primary text-sm">
              <div className="px-4 py-2 text-xs font-semibold text-gray-700">Filter by Status</div>
              <DropdownMenuItem
                onSelect={() => setFilterStatus("all")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFilterStatus("current")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Current
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFilterStatus("overdue")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Overdue
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFilterStatus("paid")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Paid
              </DropdownMenuItem>
              <div className="px-4 py-2 text-xs font-semibold text-gray-700">Filter by Balance</div>
              <DropdownMenuItem
                onSelect={() => setFilterBalance("all")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFilterBalance("zero")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Zero Balance
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFilterBalance("non-zero")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Non-Zero Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white text-text-primary border-border-light hover:bg-gray-100 transition-colors text-sm px-3 py-1.5"
              >
                {sortDirection === "asc" ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-border-light text-text-primary text-sm">
              <div className="px-4 py-2 text-xs font-semibold text-gray-700">Sort by Column</div>
              <DropdownMenuItem
                onSelect={() => setSortColumn("patientName")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Patient Name
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setSortColumn("totalOwed")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Amount Owed
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setSortColumn("status")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Status
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setSortColumn("dueDate")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Due Date
              </DropdownMenuItem>
              <div className="px-4 py-2 text-xs font-semibold text-gray-700">Sort Direction</div>
              <DropdownMenuItem
                onSelect={() => setSortDirection("asc")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setSortDirection("desc")}
                className="hover:bg-gray-100 hover:text-accent-purple text-xs"
              >
                Descending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border border-border-light shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-bg-light">
            <TableRow>
              <TableHead className="text-text-primary font-semibold text-xs py-3">Patient Name</TableHead>
              <TableHead className="text-text-primary font-semibold text-xs py-3">MRN</TableHead>
              <TableHead className="text-text-primary font-semibold text-xs py-3">Phone</TableHead>
              <TableHead className="text-right text-text-primary font-semibold text-xs py-3">Amount Owed</TableHead>
              <TableHead className="text-text-primary font-semibold text-xs py-3">Due Date</TableHead>
              <TableHead className="text-text-primary font-semibold text-xs py-3">Status</TableHead>
              <TableHead className="w-[100px] text-text-primary font-semibold text-xs py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500 text-sm">
                  No accounts found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-text-primary text-sm py-3">{account.patientName}</TableCell>
                  <TableCell className="text-text-primary text-sm py-3">{account.mrn}</TableCell>
                  <TableCell className="text-text-primary text-sm py-3">
                    {account.phone ? formatAustralianPhoneNumber(account.phone) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right text-text-primary text-sm py-3">
                    ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-text-primary text-sm py-3">
                    {account.dueDate ? new Date(account.dueDate).toLocaleDateString("en-AU") : "N/A"}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant={getStatusBadgeVariant(account.status)}
                      className={`font-medium text-xs px-2 py-0.5 ${
                        account.status === "overdue"
                          ? "bg-status-overdue text-white"
                          : account.status === "current"
                            ? "bg-status-current text-white"
                            : "bg-status-paid text-white"
                      }`}
                    >
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border-border-light text-text-primary text-sm"
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenRecordPayment(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <DollarSign className="mr-2 h-3.5 w-3.5" /> Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenPaymentHistory(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <History className="mr-2 h-3.5 w-3.5" /> Payment History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenAddCallLog(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <MessageSquare className="mr-2 h-3.5 w-3.5" /> Add Call Log
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenCallHistory(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <Phone className="mr-2 h-3.5 w-3.5" /> Call History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEditDueDate(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <CalendarDays className="mr-2 h-3.5 w-3.5" /> Edit Due Date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenPDFExport(account)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <FileText className="mr-2 h-3.5 w-3.5" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/accounts/${account.id}`)}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs underline"
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenSendPaymentLink(account)}
                          disabled={!account.phone}
                          className="hover:bg-gray-100 hover:text-accent-purple text-xs"
                        >
                          <Phone className="mr-2 h-3.5 w-3.5" /> Send Payment Link (SMS)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentDialogOpen} onOpenChange={setIsRecordPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-border-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Record Payment for {selectedAccount?.patientName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">Enter the payment details below.</DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <RecordPaymentForm
              account={selectedAccount}
              onSuccess={() => setIsRecordPaymentDialogOpen(false)}
              onCancel={() => setIsRecordPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isPaymentHistoryDialogOpen} onOpenChange={setIsPaymentHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white border-border-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Payment History for {selectedAccount?.patientName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              View all recorded payments for this account.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && <PaymentHistory accountId={selectedAccount.id} />}
        </DialogContent>
      </Dialog>

      {/* Add Call Log Dialog */}
      <Dialog open={isAddCallLogDialogOpen} onOpenChange={setIsAddCallLogDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-border-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Add Call Log for {selectedAccount?.patientName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Record details of your conversation.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <AddCallLogForm
              account={selectedAccount}
              onCancel={() => setIsAddCallLogDialogOpen(false)}
              onSuccess={() => {
                /* handle success if needed, e.g., re-fetch accounts */
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Call History Dialog */}
      <Dialog open={isCallHistoryDialogOpen} onOpenChange={setIsCallHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white border-border-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Call History for {selectedAccount?.patientName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Phone call records for {selectedAccount?.patientName} ({selectedAccount?.phone || "Phone not available"})
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && <CallHistory account={selectedAccount} />}
        </DialogContent>
      </Dialog>

      {/* PDF Export Dialog */}
      <Dialog open={isPDFExportDialogOpen} onOpenChange={setIsPDFExportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-border-light text-text-primary">
          {selectedAccount && (
            <PDFExportDialog
              accounts={[selectedAccount]}
              onClose={() => setIsPDFExportDialogOpen(false)}
              exportMode="single"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Due Date Dialog */}
      <Dialog open={isEditDueDateDialogOpen} onOpenChange={setIsEditDueDateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-border-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Edit Due Date for {selectedAccount?.patientName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Update the payment due date for this account.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <EditDueDateDialog
              account={selectedAccount}
              onSuccess={() => {
                setIsEditDueDateDialogOpen(false)
                // Optionally, refresh the page or re-fetch data to show updated due date
                router.refresh()
              }}
              onCancel={() => setIsEditDueDateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
