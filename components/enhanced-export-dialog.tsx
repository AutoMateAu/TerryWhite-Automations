"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  FileText,
  Search,
  Users,
  CheckCircle,
  Circle,
  X,
  Filter,
  AlertCircle,
  Phone,
  BarChart,
} from "lucide-react"
import type { CustomerAccount, PDFExportOptions } from "@/lib/types"
import { generateAccountPDF } from "@/utils/pdf-client"
import { generateBulkAccountsPDF } from "@/utils/pdf-client"

interface EnhancedExportDialogProps {
  accounts: CustomerAccount[]
  onClose: () => void
}

export function EnhancedExportDialog({ accounts, onClose }: EnhancedExportDialogProps) {
  const [exportMode, setExportMode] = useState<"single" | "multiple" | "all">("single")
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [singleAccountId, setSingleAccountId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "current" | "overdue" | "paid">("all")
  const [balanceFilter, setBalanceFilter] = useState({ min: "", max: "" })
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Individual account export options (for single/multiple modes)
  const [individualOptions, setIndividualOptions] = useState<PDFExportOptions>({
    includeAccountSummary: true,
    includeContactInfo: true,
    includeCallHistory: true,
    includeOutstandingBalance: true,
    includePaymentHistory: true,
    includeNotes: false,
    customTitle: "",
  })

  // Bulk export options (for all filtered mode)
  const [bulkOptions, setBulkOptions] = useState({
    includeSummaryStatistics: true,
    includeContactList: true,
    includeDetailedBreakdown: true,
    includeAgingAnalysis: true,
    groupByStatus: false,
    sortBy: "amount" as "amount" | "name" | "dueDate" | "status",
    sortDirection: "desc" as "asc" | "desc",
  })

  // Get current export options based on mode
  const currentExportOptions = useMemo(() => {
    if (exportMode === "all") {
      return {
        ...individualOptions,
        includeAccountSummary: false,
        includeContactInfo: false,
        includeCallHistory: false,
        includeOutstandingBalance: false,
        includePaymentHistory: false,
      }
    }
    return individualOptions
  }, [exportMode, individualOptions])

  const handleIndividualOptionChange = (key: keyof PDFExportOptions, value: boolean | string) => {
    setIndividualOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleBulkOptionChange = (key: string, value: boolean | string) => {
    setBulkOptions((prev) => ({ ...prev, [key]: value }))
  }

  // Filter accounts based on search and filters
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      // Search filter
      const matchesSearch =
        account.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.phone && account.phone.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filter
      const matchesStatus = statusFilter === "all" || account.status === statusFilter

      // Balance filter
      const matchesBalance =
        (!balanceFilter.min || account.totalOwed >= Number.parseFloat(balanceFilter.min)) &&
        (!balanceFilter.max || account.totalOwed <= Number.parseFloat(balanceFilter.max))

      return matchesSearch && matchesStatus && matchesBalance
    })
  }, [accounts, searchTerm, statusFilter, balanceFilter])

  // Get accounts to export based on mode
  const accountsToExport = useMemo(() => {
    switch (exportMode) {
      case "single":
        const singleAccount = accounts.find((acc) => acc.id === singleAccountId)
        return singleAccount ? [singleAccount] : []
      case "multiple":
        return accounts.filter((acc) => selectedAccountIds.has(acc.id))
      case "all":
        return filteredAccounts
      default:
        return []
    }
  }, [exportMode, singleAccountId, selectedAccountIds, accounts, filteredAccounts])

  const handleAccountToggle = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccountIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAccountIds.size === filteredAccounts.length) {
      setSelectedAccountIds(new Set())
    } else {
      setSelectedAccountIds(new Set(filteredAccounts.map((acc) => acc.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedAccountIds(new Set())
  }

  const handleAddToSelection = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds)
    newSelected.add(accountId)
    setSelectedAccountIds(newSelected)

    toast({
      title: "Account Added",
      description: "Account has been added to your selection.",
    })
  }

  const handleExport = async () => {
    if (accountsToExport.length === 0) {
      toast({
        title: "No Accounts Selected",
        description: "Please select at least one account to export.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const exportType = exportMode === "single" ? "single" : "multiple"

      if (exportMode === "all") {
        // Use bulk export with special options
        await generateBulkAccountsPDF(accountsToExport, currentExportOptions, "all", bulkOptions)
      } else {
        // Use individual account export
        await generateAccountPDF(accountsToExport, currentExportOptions, exportType)
      }

      toast({
        title: "Export Successful",
        description: `Successfully exported ${accountsToExport.length} account(s).`,
      })

      onClose()
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: CustomerAccount["status"]) => {
    switch (status) {
      case "current":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Enhanced Account Export
        </DialogTitle>
        <DialogDescription>Select accounts to export with advanced filtering and selection options.</DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection">Account Selection</TabsTrigger>
            <TabsTrigger value="options">Export Options</TabsTrigger>
            <TabsTrigger value="preview">Preview & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
            {/* Export Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="single"
                      name="exportMode"
                      checked={exportMode === "single"}
                      onChange={() => setExportMode("single")}
                    />
                    <Label htmlFor="single" className="text-sm">
                      Single Account
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="multiple"
                      name="exportMode"
                      checked={exportMode === "multiple"}
                      onChange={() => setExportMode("multiple")}
                    />
                    <Label htmlFor="multiple" className="text-sm">
                      Multiple Accounts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all"
                      name="exportMode"
                      checked={exportMode === "all"}
                      onChange={() => setExportMode("all")}
                    />
                    <Label htmlFor="all" className="text-sm">
                      All Filtered
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search by name, MRN, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="statusFilter" className="text-xs">
                      Status
                    </Label>
                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minBalance" className="text-xs">
                      Min Balance
                    </Label>
                    <Input
                      id="minBalance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={balanceFilter.min}
                      onChange={(e) => setBalanceFilter((prev) => ({ ...prev, min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBalance" className="text-xs">
                      Max Balance
                    </Label>
                    <Input
                      id="maxBalance"
                      type="number"
                      step="0.01"
                      placeholder="No limit"
                      value={balanceFilter.max}
                      onChange={(e) => setBalanceFilter((prev) => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Single Account Selection */}
            {exportMode === "single" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select Single Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={singleAccountId} onValueChange={setSingleAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.patientName} ({account.mrn}) - ${account.totalOwed.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Multiple Account Selection */}
            {exportMode === "multiple" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Select Multiple Accounts</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleSelectAll}>
                        {selectedAccountIds.size === filteredAccounts.length ? "Deselect All" : "Select All"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleClearSelection}>
                        <X className="h-3 w-3 mr-1" />
                        Clear ({selectedAccountIds.size})
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>MRN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAccountToggle(account.id)}
                                className="p-1"
                              >
                                {selectedAccountIds.has(account.id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{account.patientName}</TableCell>
                            <TableCell>{account.mrn}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(account.status)}>
                                {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>${account.totalOwed.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{account.phone || "N/A"}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Accounts Preview */}
            {exportMode === "all" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">All Filtered Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {filteredAccounts.length} accounts will be exported based on current filters.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Outstanding:</span>
                        <br />${filteredAccounts.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Overdue:</span>
                        <br />
                        {filteredAccounts.filter((acc) => acc.status === "overdue").length} accounts
                      </div>
                      <div>
                        <span className="font-medium">Current:</span>
                        <br />
                        {filteredAccounts.filter((acc) => acc.status === "current").length} accounts
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            {/* Export Content Options - Single/Multiple Account */}
            {(exportMode === "single" || exportMode === "multiple") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export Content</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Select sections to include in individual account reports
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="accountSummary"
                        checked={individualOptions.includeAccountSummary}
                        onCheckedChange={(checked) => handleIndividualOptionChange("includeAccountSummary", !!checked)}
                      />
                      <Label htmlFor="accountSummary" className="text-sm">
                        Account Summary
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contactInfo"
                        checked={individualOptions.includeContactInfo}
                        onCheckedChange={(checked) => handleIndividualOptionChange("includeContactInfo", !!checked)}
                      />
                      <Label htmlFor="contactInfo" className="text-sm">
                        Contact Information
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="callHistory"
                        checked={individualOptions.includeCallHistory}
                        onCheckedChange={(checked) => handleIndividualOptionChange("includeCallHistory", !!checked)}
                      />
                      <Label htmlFor="callHistory" className="text-sm">
                        Call History
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="outstandingBalance"
                        checked={individualOptions.includeOutstandingBalance}
                        onCheckedChange={(checked) =>
                          handleIndividualOptionChange("includeOutstandingBalance", !!checked)
                        }
                      />
                      <Label htmlFor="outstandingBalance" className="text-sm">
                        Outstanding Balance
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="paymentHistory"
                        checked={individualOptions.includePaymentHistory}
                        onCheckedChange={(checked) => handleIndividualOptionChange("includePaymentHistory", !!checked)}
                      />
                      <Label htmlFor="paymentHistory" className="text-sm">
                        Payment History
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notes"
                        checked={individualOptions.includeNotes}
                        onCheckedChange={(checked) => handleIndividualOptionChange("includeNotes", !!checked)}
                      />
                      <Label htmlFor="notes" className="text-sm">
                        Notes & Comments
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Content Options - All Filtered */}
            {exportMode === "all" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Bulk Report Structure
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Configure bulk report sections and analysis</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="summaryStatistics"
                        checked={bulkOptions.includeSummaryStatistics}
                        onCheckedChange={(checked) => handleBulkOptionChange("includeSummaryStatistics", !!checked)}
                      />
                      <Label htmlFor="summaryStatistics" className="text-sm">
                        Summary Statistics
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contactList"
                        checked={bulkOptions.includeContactList}
                        onCheckedChange={(checked) => handleBulkOptionChange("includeContactList", !!checked)}
                      />
                      <Label htmlFor="contactList" className="text-sm">
                        Contact List
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="detailedBreakdown"
                        checked={bulkOptions.includeDetailedBreakdown}
                        onCheckedChange={(checked) => handleBulkOptionChange("includeDetailedBreakdown", !!checked)}
                      />
                      <Label htmlFor="detailedBreakdown" className="text-sm">
                        Detailed Breakdown
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agingAnalysis"
                        checked={bulkOptions.includeAgingAnalysis}
                        onCheckedChange={(checked) => handleBulkOptionChange("includeAgingAnalysis", !!checked)}
                      />
                      <Label htmlFor="agingAnalysis" className="text-sm">
                        Aging Analysis
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="groupByStatus"
                        checked={bulkOptions.groupByStatus}
                        onCheckedChange={(checked) => handleBulkOptionChange("groupByStatus", !!checked)}
                      />
                      <Label htmlFor="groupByStatus" className="text-sm">
                        Group By Status
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Label htmlFor="sortBy" className="text-sm font-medium">
                        Sort By
                      </Label>
                      <Select
                        value={bulkOptions.sortBy}
                        onValueChange={(value) => handleBulkOptionChange("sortBy", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Amount Owed</SelectItem>
                          <SelectItem value="name">Patient Name</SelectItem>
                          <SelectItem value="dueDate">Due Date</SelectItem>
                          <SelectItem value="status">Account Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sortDirection" className="text-sm font-medium">
                        Sort Direction
                      </Label>
                      <Select
                        value={bulkOptions.sortDirection}
                        onValueChange={(value) => handleBulkOptionChange("sortDirection", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending (High to Low)</SelectItem>
                          <SelectItem value="asc">Ascending (Low to High)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Custom Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="customTitle" className="text-sm">
                    Custom Report Title
                  </Label>
                  <Input
                    id="customTitle"
                    placeholder="Leave empty for default title"
                    value={individualOptions.customTitle || ""}
                    onChange={(e) => handleIndividualOptionChange("customTitle", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {/* Export Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Export Mode:</Label>
                    <p className="text-sm capitalize">{exportMode}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Accounts to Export:</Label>
                    <p className="text-sm font-bold text-blue-600">{accountsToExport.length}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Total Outstanding:</Label>
                    <p className="text-sm font-bold text-green-600">
                      ${accountsToExport.reduce((sum, acc) => sum + acc.totalOwed, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Report Title:</Label>
                    <p className="text-sm">{individualOptions.customTitle || "Default Title"}</p>
                  </div>
                </div>

                {/* Content Summary */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <Label className="font-medium text-sm">Report will include:</Label>
                  <ul className="text-xs mt-2 space-y-1">
                    {exportMode === "all" ? (
                      // All Filtered mode content
                      <>
                        {bulkOptions.includeSummaryStatistics && (
                          <li>• Executive summary with totals and statistics</li>
                        )}
                        {bulkOptions.includeContactList && <li>• Contact directory with phone numbers</li>}
                        {bulkOptions.includeDetailedBreakdown && <li>• Detailed account breakdown table</li>}
                        {bulkOptions.includeAgingAnalysis && <li>• Account aging analysis (overdue accounts)</li>}
                        {bulkOptions.groupByStatus && <li>• Accounts grouped by status</li>}
                      </>
                    ) : (
                      // Single/Multiple mode content
                      <>
                        {individualOptions.includeAccountSummary && <li>• Account summary with key metrics</li>}
                        {individualOptions.includeContactInfo && <li>• Patient contact information</li>}
                        {individualOptions.includeCallHistory && <li>• Call log records and comments</li>}
                        {individualOptions.includeOutstandingBalance && <li>• Outstanding balance and due dates</li>}
                        {individualOptions.includePaymentHistory && <li>• Payment transaction history</li>}
                        {individualOptions.includeNotes && <li>• Account notes and comments</li>}
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Selected Accounts Preview */}
            {accountsToExport.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Accounts Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>MRN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountsToExport.slice(0, 10).map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.patientName}</TableCell>
                            <TableCell>{account.mrn}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(account.status)}>
                                {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>${account.totalOwed.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {accountsToExport.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Showing first 10 of {accountsToExport.length} accounts
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Alerts */}
            {accountsToExport.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No accounts selected for export. Please go back to the Account Selection tab and choose accounts to
                  export.
                </AlertDescription>
              </Alert>
            )}

            {accountsToExport.length > 100 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Large Dataset Notice:</strong> You're exporting {accountsToExport.length} accounts. This may
                  take longer to process and generate a large file.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button onClick={handleExport} disabled={isGenerating || accountsToExport.length === 0}>
          {isGenerating ? (
            <>Generating PDF...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {accountsToExport.length} Account{accountsToExport.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
