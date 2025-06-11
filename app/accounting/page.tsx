"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Database, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { checkTablesExist, getCustomerAccounts } from "@/services/accounting-service" // Import getCustomerAccounts
import { SetupGuide } from "@/components/setup-guide"
import AccountingOverview from "@/components/accounting-overview"
import CustomerAccountTable from "@/components/customer-account-table"
import type { CustomerAccount } from "@/lib/types" // Import CustomerAccount type

export default function AccountingPage() {
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([]) // State to hold accounts

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
        setIsUsingMockData(true) // Assume mock data if fetch fails
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Accounting</h1>
        <div className="flex justify-center items-center h-64">
          <p>Loading accounting dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AccountingOverview accounts={customerAccounts} /> {/* Pass accounts to AccountingOverview */}
      <CustomerAccountTable accounts={customerAccounts} /> {/* Pass accounts to CustomerAccountTable */}
      {isUsingMockData && (
        <div className="container mx-auto px-6 mt-6">
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Using Mock Data</AlertTitle>
            <AlertDescription>
              You're currently viewing mock data. To set up the database with real data, click the "Setup Database"
              button.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col items-end mb-4">
            <Button onClick={() => setShowSetupGuide(true)} variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Setup Database
            </Button>
          </div>
        </div>
      )}
      <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Database Setup Guide</DialogTitle>
          </DialogHeader>
          <SetupGuide onClose={() => setShowSetupGuide(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
