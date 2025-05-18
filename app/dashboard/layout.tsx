"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/")
    } else {
      // Initialize permissions if they don't exist
      const userData = JSON.parse(user)
      if (!userData.permissions) {
        userData.permissions =
          userData.role === "admin"
            ? {
                users: ["view", "create", "edit", "delete"],
                branches: ["view", "create", "edit", "delete"],
                employees: ["view", "create", "edit", "delete"],
                settings: ["view", "edit"],
              }
            : {
                users: [],
                branches: ["view"],
                employees: ["view"],
                settings: [],
              }
        localStorage.setItem("user", JSON.stringify(userData))
      }
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
