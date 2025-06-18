import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar" // Assuming sidebar.tsx is in components/ui
import { Toaster } from "@/components/ui/toaster"
import { Separator } from "@/components/ui/separator"

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Pharmacy Management",
  description: "Pharmacy Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen")}> 
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
                  <SidebarTrigger className="lg:hidden" />
                  <Separator orientation="vertical" className="mx-2 h-4 lg:hidden" />
                  <h1 className="text-xl font-semibold">Pharmacy Management</h1>
                </header>
                <main className="flex-1 overflow-auto p-4">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
