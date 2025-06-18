"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Database, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { checkTablesExist, getCustomerAccounts } from "@/services/accounting-service"
import { SetupGuide } from "@/components/setup-guide"
import AccountingOverview from "@/components/accounting-overview"
import CustomerAccountTable from "@/components/customer-account-table"
import type { CustomerAccount } from "@/lib/types"

export default function AccountingPage() {
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([])

  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const tablesExist = await checkTablesExist()
        setIsUsingMockData(!tablesExist)

        if (!tablesExist) {
          toast({
            title: "Using mock data",
            description: "Database tables not found. Click 'Setup Database' for instructions.",
            variant: "warning",
          })
        }

        const accounts = await getCustomerAccounts()
        setCustomerAccounts(accounts)
      } catch (error) {
        console.error("Error fetching accounting data:", error)
        toast({
          title: "Error",
          description: "Failed to load accounting data.",
          variant: "destructive",
        })
        setIsUsingMockData(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-6 bg-soft-offwhite">
        <h1 className="text-3xl font-bold mb-8 text-deep-purple">Accounting</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-slate-dark font-medium">Loading accounting dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 md:px-12 py-12 bg-soft-offwhite">
      {/* Section 1: Overview Cards */}
      <AccountingOverview accounts={customerAccounts} />

      {/* Section 2: Table */}
      <div className="mt-12">
        <CustomerAccountTable accounts={customerAccounts} />
      </div>

      {/* Section 3: Alert + Setup Guide Button */}
      {isUsingMockData && (
        <div className="mt-10 animate-fade-in-up delay-600">
          <Alert variant="warning" className="mb-6 bg-white border-light-pink text-slate-dark">
            <AlertTriangle className="h-4 w-4 text-light-pink" />
            <AlertTitle className="font-semibold text-deep-purple">Using Mock Data</AlertTitle>
            <AlertDescription className="font-medium">
              You're currently viewing mock data. To set up the database with real data, click the "Setup Database"
              button.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSetupGuide(true)}
              variant="outline"
              className="bg-violet-highlight text-white hover:bg-deep-purple hover:text-white transition-colors underline"
            >
              <Database className="mr-2 h-4 w-4" />
              Setup Database
            </Button>
          </div>
        </div>
      )}

      {/* Dialog: Setup Guide */}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-deep-purple">Database Setup Guide</DialogTitle>
          </DialogHeader>
          <SetupGuide onClose={() => setShowSetupGuide(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
