"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, FileText, Send, Pill, DollarSign } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar" // Assuming sidebar.tsx is in components/ui
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/template", label: "Template", icon: FileText },
  { href: "/discharge", label: "Discharge", icon: Send },
  { href: "/accounting", label: "Accounting", icon: DollarSign },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="hidden lg:flex lg:flex-col lg:border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Pill className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">PharmaSys</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard")}
                    className={cn(
                      "w-full justify-start",
                      (pathname === item.href ||
                        (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/")) &&
                        "bg-muted",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
