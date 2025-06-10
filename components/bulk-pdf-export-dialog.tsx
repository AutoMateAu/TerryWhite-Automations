"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileText, Calendar, Users, Clock } from "lucide-react"
import type { CustomerAccount, PDFExportOptions } from "@/lib/types"
import { generateBulkAccountsPDF } from "@/utils/pdf-client"

interface BulkPDFExportDialogProps {
  accounts: CustomerAccount[]
  reportType: "overdue" | "all" | "current"
  onClose: () => void
}

export function BulkPDFExportDialog({ accounts, reportType, onClose }: BulkPDFExportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Export options state (minimal for bulk reports)
  const [options, setOptions] = useState<PDFExportOptions>({
    includeContactInfo: false,
    includePaymentHistory: false,
    includeCallHistory: false,
    includeOutstandingBalance: false,
    includeAccountSummary: false,
    includeNotes: false,
    customTitle: "",
  })

  // Date range state
  const [paymentDateRange, setPaymentDateRange] = useState({
    enabled: false,
    startDate: "",
    endDate: "",
  })

  const [callDateRange, setCallDateRange] = useState({
    enabled: false,
    startDate: "",
    endDate: "",
  })

  // Advanced options
  const [advancedOptions, setAdvancedOptions] = useState({
    includeDetailedBreakdown: true,
    includeSummaryStatistics: true,
    includeContactList: true,
    includeAgingAnalysis: true,
    groupByStatus: false,
    sortBy: "amount" as "amount" | "name" | "dueDate" | "status",
    sortDirection: "desc" as "asc" | "desc",
  })

  // Additional filters for all accounts
  const [accountFilters, setAccountFilters] = useState({
    minBalance: "",
    maxBalance: "",
    includeZeroBalance: reportType === "all",
    includePaidAccounts: reportType === "all",
    minDaysOverdue: reportType === "overdue" ? "1" : "",
    maxDaysOverdue: "",
  })

  const handleOptionChange = (key: keyof PDFExportOptions, value: boolean | string) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const getReportTitle = () => {
    switch (reportType) {
      case "overdue":
        return "Overdue Accounts Report"
      case "current":
        return "Current Accounts Report"
      case "all":
        return "All Accounts Report"
      default:
        return "Accounts Report"
    }
  }

  const getReportDescription = () => {
    const filteredAccounts = getFilteredAccounts()
    switch (reportType) {
      case "overdue":
        return `Export ${filteredAccounts.length} overdue accounts with total outstanding of $${filteredAccounts
          .reduce((sum, acc) => sum + acc.totalOwed, 0)
          .toFixed(2)}`
      case "current":
        return `Export ${filteredAccounts.length} current accounts with total outstanding of $${filteredAccounts
          .reduce((sum, acc) => sum + acc.totalOwed, 0)
          .toFixed(2)}`
      case "all":
        return `Export ${filteredAccounts.length} accounts with total outstanding of $${filteredAccounts
          .reduce((sum, acc) => sum + acc.totalOwed, 0)
          .toFixed(2)}`
      default:
        return `Export ${filteredAccounts.length} accounts`
    }
  }

  const getFilteredAccounts = () => {
    return accounts.filter((account) => {
      // Apply base filter by report type
      if (reportType === "overdue" && account.status !== "overdue") return false
      if (reportType === "current" && account.status !== "current") return false

      // Apply additional filters
      if (accountFilters.minBalance && account.totalOwed < Number.parseFloat(accountFilters.minBalance)) {
        return false
      }

      if (accountFilters.maxBalance && account.totalOwed > Number.parseFloat(accountFilters.maxBalance)) {
        return false
      }

      if (!accountFilters.includeZeroBalance && account.totalOwed === 0) {
        return false
      }

      if (!accountFilters.includePaidAccounts && account.status === "paid") {
        return false
      }

      // Days overdue filter (for overdue accounts)
      if (reportType === "overdue" && (accountFilters.minDaysOverdue || accountFilters.maxDaysOverdue)) {
        const baseDate = account.lastPaymentDate ? new Date(account.lastPaymentDate) : new Date(account.createdAt)
        const dueDate = new Date(baseDate)
        dueDate.setDate(dueDate.getDate() + 30)
        const today = new Date()
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (accountFilters.minDaysOverdue && daysOverdue < Number.parseInt(accountFilters.minDaysOverdue)) {
          return false
        }

        if (accountFilters.maxDaysOverdue && daysOverdue > Number.parseInt(accountFilters.maxDaysOverdue)) {
          return false
        }
      }

      return true
    })
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)

    try {
      // Prepare export options
      const exportOptions: PDFExportOptions = {
        ...options,
        paymentDateRange: paymentDateRange.enabled
          ? {
              startDate: paymentDateRange.startDate,
              endDate: paymentDateRange.endDate,
            }
          : undefined,
        callDateRange: callDateRange.enabled
          ? {
              startDate: callDateRange.startDate,
              endDate: callDateRange.endDate,
            }
          : undefined,
        customTitle: options.customTitle || getReportTitle(),
      }

      // Validate date ranges
      if (paymentDateRange.enabled && (!paymentDateRange.startDate || !paymentDateRange.endDate)) {
        toast({
          title: "Invalid Date Range",
          description: "Please provide both start and end dates for payment history filter.",
          variant: "destructive",
        })
        return
      }

      if (callDateRange.enabled && (!callDateRange.startDate || !callDateRange.endDate)) {
        toast({
          title: "Invalid Date Range",
          description: "Please provide both start and end dates for call history filter.",
          variant: "destructive",
        })
        return
      }

      // Get filtered accounts
      const accountsToExport = getFilteredAccounts()

      if (accountsToExport.length === 0) {
        toast({
          title: "No Accounts to Export",
          description: "No accounts match the selected filters.",
          variant: "destructive",
        })
        return
      }

      if (accountsToExport.length > 200) {
        toast({
          title: "Large Dataset Warning",
          description: `You're about to export ${accountsToExport.length} accounts. This may take a while.`,
        })
      }

      // Generate PDF
      await generateBulkAccountsPDF(accountsToExport, exportOptions, reportType, advancedOptions)

      toast({
        title: "PDF Generated Successfully",
        description: `${getReportTitle()} has been downloaded with ${accountsToExport.length} accounts.`,
      })

      onClose()
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while generating the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const getEstimatedFileSize = () => {
    const filteredAccounts = getFilteredAccounts()
    const baseSize = 100 // KB base size for bulk reports
    const sizePerAccount = 15 // KB per account for bulk reports
    const detailMultiplier = advancedOptions.includeDetailedBreakdown ? 1.5 : 1

    return Math.round(baseSize + filteredAccounts.length * sizePerAccount * detailMultiplier)
  }

  const getEstimatedProcessingTime = () => {
    const filteredAccounts = getFilteredAccounts()
    const baseTime = 3 // seconds
    const timePerAccount = 0.1 // seconds per account

    return Math.round(baseTime + filteredAccounts.length * timePerAccount)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {getReportTitle()} - PDF Export
        </DialogTitle>
        <DialogDescription>{getReportDescription()}</DialogDescription>
      </DialogHeader>

      <div className="py-4 max-h-[70vh] overflow-y-auto">
        <Tabs defaultValue="structure" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structure">Report Structure</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-4">
            {/* Report Structure Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Report Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="summaryStats"
                      checked={advancedOptions.includeSummaryStatistics}
                      onCheckedChange={(checked) =>
                        setAdvancedOptions((prev) => ({ ...prev, includeSummaryStatistics: !!checked }))
                      }
                    />
                    <Label htmlFor="summaryStats" className="text-sm">
                      Summary Statistics
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="detailedBreakdown"
                      checked={advancedOptions.includeDetailedBreakdown}
                      onCheckedChange={(checked) =>
                        setAdvancedOptions((prev) => ({ ...prev, includeDetailedBreakdown: !!checked }))
                      }
                    />
                    <Label htmlFor="detailedBreakdown" className="text-sm">
                      Detailed Breakdown
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contactList"
                      checked={advancedOptions.includeContactList}
                      onCheckedChange={(checked) =>
                        setAdvancedOptions((prev) => ({ ...prev, includeContactList: !!checked }))
                      }
                    />
                    <Label htmlFor="contactList" className="text-sm">
                      Contact List
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agingAnalysis"
                      checked={advancedOptions.includeAgingAnalysis}
                      onCheckedChange={(checked) =>
                        setAdvancedOptions((prev) => ({ ...prev, includeAgingAnalysis: !!checked }))
                      }
                    />
                    <Label htmlFor="agingAnalysis" className="text-sm">
                      Aging Analysis
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sorting Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sorting & Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sortBy" className="text-sm">
                      Sort By
                    </Label>
                    <Select
                      value={advancedOptions.sortBy}
                      onValueChange={(value: any) => setAdvancedOptions((prev) => ({ ...prev, sortBy: value }))}
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
                    <Label htmlFor="sortDirection" className="text-sm">
                      Sort Direction
                    </Label>
                    <Select
                      value={advancedOptions.sortDirection}
                      onValueChange={(value: any) => setAdvancedOptions((prev) => ({ ...prev, sortDirection: value }))}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="groupByStatus"
                    checked={advancedOptions.groupByStatus}
                    onCheckedChange={(checked) => setAdvancedOptions((prev) => ({ ...prev, groupByStatus: !!checked }))}
                  />
                  <Label htmlFor="groupByStatus" className="text-sm">
                    Group Accounts by Status
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Custom Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="customTitle" className="text-sm">
                    Custom Report Title
                  </Label>
                  <Input
                    id="customTitle"
                    placeholder={getReportTitle()}
                    value={options.customTitle || ""}
                    onChange={(e) => handleOptionChange("customTitle", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            {/* Date Range Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment History Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paymentDateFilter"
                      checked={paymentDateRange.enabled}
                      onCheckedChange={(checked) => setPaymentDateRange((prev) => ({ ...prev, enabled: !!checked }))}
                    />
                    <Label htmlFor="paymentDateFilter" className="text-sm font-medium">
                      Filter Payment History by Date
                    </Label>
                  </div>

                  {paymentDateRange.enabled && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label htmlFor="paymentStartDate" className="text-xs">
                          From
                        </Label>
                        <Input
                          id="paymentStartDate"
                          type="date"
                          value={paymentDateRange.startDate}
                          onChange={(e) => setPaymentDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentEndDate" className="text-xs">
                          To
                        </Label>
                        <Input
                          id="paymentEndDate"
                          type="date"
                          value={paymentDateRange.endDate}
                          onChange={(e) => setPaymentDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Call History Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="callDateFilter"
                      checked={callDateRange.enabled}
                      onCheckedChange={(checked) => setCallDateRange((prev) => ({ ...prev, enabled: !!checked }))}
                    />
                    <Label htmlFor="callDateFilter" className="text-sm font-medium">
                      Filter Call History by Date
                    </Label>
                  </div>

                  {callDateRange.enabled && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label htmlFor="callStartDate" className="text-xs">
                          From
                        </Label>
                        <Input
                          id="callStartDate"
                          type="date"
                          value={callDateRange.startDate}
                          onChange={(e) => setCallDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="callEndDate" className="text-xs">
                          To
                        </Label>
                        <Input
                          id="callEndDate"
                          type="date"
                          value={callDateRange.endDate}
                          onChange={(e) => setCallDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minBalance" className="text-sm">
                      Min Balance ($)
                    </Label>
                    <Input
                      id="minBalance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={accountFilters.minBalance}
                      onChange={(e) => setAccountFilters((prev) => ({ ...prev, minBalance: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBalance" className="text-sm">
                      Max Balance ($)
                    </Label>
                    <Input
                      id="maxBalance"
                      type="number"
                      step="0.01"
                      placeholder="No limit"
                      value={accountFilters.maxBalance}
                      onChange={(e) => setAccountFilters((prev) => ({ ...prev, maxBalance: e.target.value }))}
                    />
                  </div>
                </div>

                {reportType === "overdue" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="minDaysOverdue" className="text-sm">
                        Min Days Overdue
                      </Label>
                      <Input
                        id="minDaysOverdue"
                        type="number"
                        placeholder="1"
                        value={accountFilters.minDaysOverdue}
                        onChange={(e) => setAccountFilters((prev) => ({ ...prev, minDaysOverdue: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxDaysOverdue" className="text-sm">
                        Max Days Overdue
                      </Label>
                      <Input
                        id="maxDaysOverdue"
                        type="number"
                        placeholder="No limit"
                        value={accountFilters.maxDaysOverdue}
                        onChange={(e) => setAccountFilters((prev) => ({ ...prev, maxDaysOverdue: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeZeroBalance"
                      checked={accountFilters.includeZeroBalance}
                      onCheckedChange={(checked) =>
                        setAccountFilters((prev) => ({ ...prev, includeZeroBalance: !!checked }))
                      }
                    />
                    <Label htmlFor="includeZeroBalance" className="text-sm">
                      Include Zero Balance Accounts
                    </Label>
                  </div>

                  {reportType === "all" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includePaidAccounts"
                        checked={accountFilters.includePaidAccounts}
                        onCheckedChange={(checked) =>
                          setAccountFilters((prev) => ({ ...prev, includePaidAccounts: !!checked }))
                        }
                      />
                      <Label htmlFor="includePaidAccounts" className="text-sm">
                        Include Paid Accounts
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {/* Preview Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Accounts to Export:</Label>
                    <p className="text-lg font-bold text-blue-600">{getFilteredAccounts().length}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Total Outstanding:</Label>
                    <p className="text-lg font-bold text-green-600">
                      $
                      {getFilteredAccounts()
                        .reduce((sum, acc) => sum + acc.totalOwed, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Estimated File Size:</Label>
                    <p className="text-sm">{getEstimatedFileSize()} KB</p>
                  </div>
                  <div>
                    <Label className="font-medium">Processing Time:</Label>
                    <p className="text-sm">~{getEstimatedProcessingTime()} seconds</p>
                  </div>
                </div>

                {/* Content Summary */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <Label className="font-medium text-sm">Report will include:</Label>
                  <ul className="text-xs mt-2 space-y-1">
                    {advancedOptions.includeSummaryStatistics && <li>• Summary statistics and totals</li>}
                    {advancedOptions.includeContactList && <li>• Quick reference contact list</li>}
                    {advancedOptions.includeDetailedBreakdown && <li>• Detailed account breakdown</li>}
                    {advancedOptions.includeAgingAnalysis && <li>• Account aging analysis</li>}
                    {advancedOptions.groupByStatus && <li>• Accounts grouped by status</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Performance Warning */}
            {getFilteredAccounts().length > 100 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Large Dataset Notice:</strong>
                  <br />
                  You're exporting {getFilteredAccounts().length} accounts. This may take {getEstimatedProcessingTime()}{" "}
                  seconds to complete. The browser may appear unresponsive during generation.
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
        <Button onClick={handleGeneratePDF} disabled={isGenerating || getFilteredAccounts().length === 0}>
          {isGenerating ? (
            <>Generating PDF...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF ({getFilteredAccounts().length} accounts)
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
