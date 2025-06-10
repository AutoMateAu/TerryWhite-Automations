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
import { Download, FileText, Settings, Calendar, Users, AlertTriangle } from "lucide-react"
import type { CustomerAccount, PDFExportOptions } from "@/lib/types"
import { generateAccountPDF } from "@/utils/pdf-client"

interface PDFExportDialogProps {
  accounts: CustomerAccount[]
  selectedAccount?: CustomerAccount
  onClose: () => void
}

export function PDFExportDialog({ accounts, selectedAccount, onClose }: PDFExportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportType, setExportType] = useState<"single" | "multiple">(selectedAccount ? "single" : "multiple")
  const [selectedAccountId, setSelectedAccountId] = useState<string>(selectedAccount?.id || "")
  const { toast } = useToast()

  // Export options state
  const [options, setOptions] = useState<PDFExportOptions>({
    includeContactInfo: true,
    includePaymentHistory: true,
    includeCallHistory: true,
    includeOutstandingBalance: true,
    includeAccountSummary: true,
    includeNotes: true,
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

  // Filter options for multiple accounts
  const [accountFilters, setAccountFilters] = useState({
    statusFilter: "all" as "all" | "current" | "overdue" | "paid",
    minBalance: "",
    maxBalance: "",
    includeZeroBalance: true,
  })

  const handleOptionChange = (key: keyof PDFExportOptions, value: boolean | string) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
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

      // Filter accounts for multiple export
      let accountsToExport = accounts
      if (exportType === "multiple") {
        accountsToExport = accounts.filter((account) => {
          // Status filter
          if (accountFilters.statusFilter !== "all" && account.status !== accountFilters.statusFilter) {
            return false
          }

          // Balance filters
          if (accountFilters.minBalance && account.totalOwed < Number.parseFloat(accountFilters.minBalance)) {
            return false
          }

          if (accountFilters.maxBalance && account.totalOwed > Number.parseFloat(accountFilters.maxBalance)) {
            return false
          }

          // Zero balance filter
          if (!accountFilters.includeZeroBalance && account.totalOwed === 0) {
            return false
          }

          return true
        })

        if (accountsToExport.length === 0) {
          toast({
            title: "No Accounts to Export",
            description: "No accounts match the selected filters.",
            variant: "destructive",
          })
          return
        }

        if (accountsToExport.length > 100) {
          toast({
            title: "Large Dataset Warning",
            description: `You're about to export ${accountsToExport.length} accounts. This may take a while.`,
          })
        }
      } else {
        // Single account export
        const account = accounts.find((acc) => acc.id === selectedAccountId)
        if (!account) {
          toast({
            title: "Account Not Found",
            description: "Please select a valid account to export.",
            variant: "destructive",
          })
          return
        }
        accountsToExport = [account]
      }

      // Generate PDF
      await generateAccountPDF(accountsToExport, exportOptions, exportType)

      toast({
        title: "PDF Generated Successfully",
        description: `${exportType === "single" ? "Account report" : "Accounts report"} has been downloaded.`,
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
    const baseSize = 50 // KB base size
    const accountCount = exportType === "single" ? 1 : accounts.length
    const sizePerAccount = 15 // KB per account
    const historyMultiplier = (options.includePaymentHistory ? 1.5 : 1) * (options.includeCallHistory ? 1.3 : 1)

    return Math.round(baseSize + accountCount * sizePerAccount * historyMultiplier)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Patient Accounts to PDF
        </DialogTitle>
        <DialogDescription>
          Generate a comprehensive PDF report of patient account information with customizable options.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 max-h-[70vh] overflow-y-auto">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Options</TabsTrigger>
            <TabsTrigger value="filters">Filters & Dates</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Export Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="single"
                    name="exportType"
                    checked={exportType === "single"}
                    onChange={() => setExportType("single")}
                  />
                  <Label htmlFor="single">Single Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="multiple"
                    name="exportType"
                    checked={exportType === "multiple"}
                    onChange={() => setExportType("multiple")}
                  />
                  <Label htmlFor="multiple">Multiple Accounts ({accounts.length} total)</Label>
                </div>

                {exportType === "single" && (
                  <div className="mt-3">
                    <Label htmlFor="accountSelect">Select Account</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.patientName} ({account.mrn})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Content Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accountSummary"
                      checked={options.includeAccountSummary}
                      onCheckedChange={(checked) => handleOptionChange("includeAccountSummary", !!checked)}
                    />
                    <Label htmlFor="accountSummary" className="text-sm">
                      Account Summary
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contactInfo"
                      checked={options.includeContactInfo}
                      onCheckedChange={(checked) => handleOptionChange("includeContactInfo", !!checked)}
                    />
                    <Label htmlFor="contactInfo" className="text-sm">
                      Contact Information
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="callHistory"
                      checked={options.includeCallHistory}
                      onCheckedChange={(checked) => handleOptionChange("includeCallHistory", !!checked)}
                    />
                    <Label htmlFor="callHistory" className="text-sm">
                      Call History
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="outstandingBalance"
                      checked={options.includeOutstandingBalance}
                      onCheckedChange={(checked) => handleOptionChange("includeOutstandingBalance", !!checked)}
                    />
                    <Label htmlFor="outstandingBalance" className="text-sm">
                      Outstanding Balance
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paymentHistory"
                      checked={options.includePaymentHistory}
                      onCheckedChange={(checked) => handleOptionChange("includePaymentHistory", !!checked)}
                    />
                    <Label htmlFor="paymentHistory" className="text-sm">
                      Payment History
                    </Label>
                  </div>
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

            {/* Account Filters (for multiple accounts) */}
            {exportType === "multiple" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Account Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="statusFilter" className="text-sm">
                      Account Status
                    </Label>
                    <Select
                      value={accountFilters.statusFilter}
                      onValueChange={(value: any) => setAccountFilters((prev) => ({ ...prev, statusFilter: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="current">Current Only</SelectItem>
                        <SelectItem value="overdue">Overdue Only</SelectItem>
                        <SelectItem value="paid">Paid Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
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
                    placeholder="Leave empty for default title"
                    value={options.customTitle || ""}
                    onChange={(e) => handleOptionChange("customTitle", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Info */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Information:</strong>
                <br />• Estimated file size: ~{getEstimatedFileSize()} KB
                <br />• Large datasets (100+ accounts) may take longer to process
                <br />• Special characters in patient data will be automatically sanitized
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button onClick={handleGeneratePDF} disabled={isGenerating}>
          {isGenerating ? (
            <>Generating PDF...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
