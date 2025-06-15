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
    <div className="container mx-auto px-6 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customer Accounts</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2 text-sm font-medium">Filter by Status</div>
              <DropdownMenuItem onSelect={() => setFilterStatus("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterStatus("current")}>Current</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterStatus("overdue")}>Overdue</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterStatus("paid")}>Paid</DropdownMenuItem>
              <div className="px-4 py-2 text-sm font-medium">Filter by Balance</div>
              <DropdownMenuItem onSelect={() => setFilterBalance("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterBalance("zero")}>Zero Balance</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterBalance("non-zero")}>Non-Zero Balance</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-2 text-sm font-medium">Sort by Column</div>
              <DropdownMenuItem onSelect={() => setSortColumn("patientName")}>Patient Name</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortColumn("totalOwed")}>Amount Owed</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortColumn("status")}>Status</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortColumn("dueDate")}>Due Date</DropdownMenuItem>
              <div className="px-4 py-2 text-sm font-medium">Sort Direction</div>
              <DropdownMenuItem onSelect={() => setSortDirection("asc")}>Ascending</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSortDirection("desc")}>Descending</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>MRN</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Amount Owed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                  No accounts found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.patientName}</TableCell>
                  <TableCell>{account.mrn}</TableCell>
                  <TableCell>{account.phone ? formatAustralianPhoneNumber(account.phone) : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    ${account.totalOwed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {account.dueDate ? new Date(account.dueDate).toLocaleDateString("en-AU") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(account.status)}>
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenRecordPayment(account)}>
                          <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPaymentHistory(account)}>
                          <History className="mr-2 h-4 w-4" /> Payment History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAddCallLog(account)}>
                          <MessageSquare className="mr-2 h-4 w-4" /> Add Call Log
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCallHistory(account)}>
                          <Phone className="mr-2 h-4 w-4" /> Call History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditDueDate(account)}>
                          <CalendarDays className="mr-2 h-4 w-4" /> Edit Due Date
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPDFExport(account)}>
                          <FileText className="mr-2 h-4 w-4" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/accounts/${account.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenSendPaymentLink(account)} disabled={!account.phone}>
                          <Phone className="mr-2 h-4 w-4" /> Send Payment Link (SMS)
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedAccount?.patientName}</DialogTitle>
            <DialogDescription>Enter the payment details below.</DialogDescription>
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment History for {selectedAccount?.patientName}</DialogTitle>
            <DialogDescription>View all recorded payments for this account.</DialogDescription>
          </DialogHeader>
          {selectedAccount && <PaymentHistory accountId={selectedAccount.id} />}
        </DialogContent>
      </Dialog>

      {/* Add Call Log Dialog */}
      <Dialog open={isAddCallLogDialogOpen} onOpenChange={setIsAddCallLogDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Call Log for {selectedAccount?.patientName}</DialogTitle>
            <DialogDescription>Record details of your conversation.</DialogDescription>
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call History for {selectedAccount?.patientName}</DialogTitle>
            <DialogDescription>View all recorded calls for this account.</DialogDescription>
          </DialogHeader>
          {selectedAccount && <CallHistory accountId={selectedAccount.id} />}
        </DialogContent>
      </Dialog>

      {/* PDF Export Dialog */}
      <Dialog open={isPDFExportDialogOpen} onOpenChange={setIsPDFExportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Due Date for {selectedAccount?.patientName}</DialogTitle>
            <DialogDescription>Update the payment due date for this account.</DialogDescription>
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
