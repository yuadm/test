
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "../integrations/supabase/client"
import { PermissionCheck } from "./permission-check"

export default function DashboardSidebar() {
  const { collapsed } = useSidebar()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("user")
          window.location.href = "/"
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  const isActive = (path: string) => pathname === path
  const menuItemClasses = (path: string) =>
    `flex items-center gap-2 w-full px-3 py-2 rounded-md ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
    }`

  return (
    <Sidebar
      className={`border-r border-r-sidebar-border bg-sidebar ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
      collapsible
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">Admin Portal</h2>
        )}
        <SidebarTrigger className={`${collapsed ? "mx-auto" : "ml-auto"} h-8 w-8`} />
      </div>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard" className={menuItemClasses("/dashboard")}>
                <Home size={20} />
                {!collapsed && <span>Dashboard</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <PermissionCheck module="users" permission="view">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/users" className={menuItemClasses("/dashboard/users")}>
                  <Users size={20} />
                  {!collapsed && <span>Users</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </PermissionCheck>

          <PermissionCheck module="branches" permission="view">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/branches" className={menuItemClasses("/dashboard/branches")}>
                  <Building size={20} />
                  {!collapsed && <span>Branches</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </PermissionCheck>

          <PermissionCheck module="settings" permission="view">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/settings" className={menuItemClasses("/dashboard/settings")}>
                  <Settings size={20} />
                  {!collapsed && <span>Settings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </PermissionCheck>
        </SidebarMenu>
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </Sidebar>
  )
}
