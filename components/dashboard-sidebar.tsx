"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Users, Building, LogOut, Home, Settings, User, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PermissionCheck } from "@/components/permission-check"

// Define all sidebar modules - this should match the sidebarModules in sidebar-visibility.tsx
const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    module: "dashboard", // Everyone can see the dashboard
    permission: "view",
    alwaysShow: true, // Always show this item regardless of permissions
  },
  {
    title: "User Management",
    icon: Users,
    href: "/dashboard/users",
    module: "users",
    permission: "view",
  },
  {
    title: "Branches",
    icon: Building,
    href: "/dashboard/branches",
    module: "branches",
    permission: "view",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    module: "settings",
    permission: "view",
  },
  // Future items can be easily added here
]

export default function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-gray-700" />
            <div className="font-bold text-xl">Admin Panel</div>
          </div>
          <div className="lg:hidden absolute right-4 top-4">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <PermissionCheck
                key={item.title}
                module={item.module}
                permission={item.permission}
                fallback={
                  item.alwaysShow ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null
                }
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionCheck>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-gray-200 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium text-sm">{user?.name || "Admin User"}</div>
                <div className="text-xs text-gray-500">{user?.email || "admin@example.com"}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
