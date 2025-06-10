"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCustomerAccounts } from "@/services/accounting-service"
import { Skeleton } from "@/components/ui/skeleton"
import type { CustomerAccount } from "@/lib/types" // Import CustomerAccount type

export default function CustomerAccountTable() {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCustomerAccounts().then((data) => {
      setAccounts(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto mt-10 px-6">
        <Card className="rounded-2xl shadow-md p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full" />
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto mt-10 px-6">
      <Card className="rounded-3xl shadow-xl overflow-hidden border border-gray-200">
        <CardHeader className="bg-white px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">Customer Accounts</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 p-0">
          {" "}
          {/* Removed default padding */}
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 px-4">No accounts available.</p>
          ) : (
            <ul>
              {accounts.map((account) => (
                <li
                  key={account.id}
                  // The original code had a hardcoded route.
                  // For now, I'll keep it as a placeholder.
                  // You'll need to create a page at `app/accounts/[id]/page.tsx`
                  // to handle the navigation.
                  onClick={() => router.push(`/accounts/${account.id}`)}
                  className="flex justify-between items-center px-6 py-5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-base font-medium text-gray-900">{account.patientName}</p>
                    <p className="text-sm text-gray-500">
                      MRN: {account.mrn} • {account.phone || "No phone"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-semibold text-gray-800">${account.totalOwed.toFixed(2)}</span>
                    <Badge
                      className={
                        account.status === "overdue"
                          ? "bg-red-100 text-red-700"
                          : account.status === "current"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }
                    >
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
