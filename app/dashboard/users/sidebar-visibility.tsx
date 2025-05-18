"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, Users, Building, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Define all sidebar modules that can be toggled
const sidebarModules = [
  {
    key: "dashboard",
    name: "Dashboard",
    icon: Home,
    description: "Main dashboard view",
    alwaysVisible: true, // Cannot be hidden
  },
  {
    key: "users",
    name: "User Management",
    icon: Users,
    description: "User and permission management",
  },
  {
    key: "branches",
    name: "Branches",
    icon: Building,
    description: "Branch and employee management",
  },
  {
    key: "settings",
    name: "Settings",
    icon: Settings,
    description: "System settings and configuration",
  },
  // Future modules can be easily added here
]

export default function SidebarVisibility() {
  const [users, setUsers] = useState<any[]>([])
  const [expandedUser, setExpandedUser] = useState<number | null>(null)

  useEffect(() => {
    const storedUsers = localStorage.getItem("users")
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    }
  }, [])

  const toggleModuleVisibility = (userId: number, module: string) => {
    const updatedUsers = users.map((user) => {
      if (user.id === userId) {
        // Create a copy of the user's permissions
        const updatedPermissions = { ...user.permissions }

        // If the user has module.view permission, remove it
        // Otherwise, add it
        if (updatedPermissions[module]?.includes("view")) {
          updatedPermissions[module] = updatedPermissions[module].filter((p: string) => p !== "view")
        } else {
          updatedPermissions[module] = [...(updatedPermissions[module] || []), "view"]
        }

        return {
          ...user,
          permissions: updatedPermissions,
        }
      }
      return user
    })

    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
  }

  const toggleExpandUser = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sidebar Visibility Control</CardTitle>
        <CardDescription>
          Control which sidebar items users can see. This affects what sections appear in the navigation sidebar for
          each user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Visible Sidebar Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <>
                <TableRow key={user.id} className={expandedUser === user.id ? "border-b-0" : ""}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* Always show Dashboard badge */}
                      <Badge variant="outline" className="bg-gray-100">
                        Dashboard
                      </Badge>

                      {/* Show badges for modules the user can see */}
                      {sidebarModules
                        .filter((module) => !module.alwaysVisible && user.permissions?.[module.key]?.includes("view"))
                        .map((module) => (
                          <Badge key={module.key} variant="outline" className="bg-green-100">
                            {module.name}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => toggleExpandUser(user.id)}>
                      {expandedUser === user.id ? "Close" : "Configure"}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded row with detailed controls */}
                {expandedUser === user.id && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={4} className="p-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Configure Sidebar Items for {user.name}</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {sidebarModules.map((module) => (
                            <div
                              key={module.key}
                              className="flex items-center justify-between space-x-2 rounded-md border p-4"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="rounded-full bg-gray-100 p-2">
                                  <module.icon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{module.name}</p>
                                  <p className="text-xs text-gray-500">{module.description}</p>
                                </div>
                              </div>
                              {module.alwaysVisible ? (
                                <Badge variant="outline" className="bg-gray-100">
                                  Always visible
                                </Badge>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${user.id}-${module.key}`}
                                    checked={user.permissions?.[module.key]?.includes("view")}
                                    onCheckedChange={() => toggleModuleVisibility(user.id, module.key)}
                                  />
                                  <Label htmlFor={`${user.id}-${module.key}`} className="text-xs">
                                    {user.permissions?.[module.key]?.includes("view") ? "Visible" : "Hidden"}
                                  </Label>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
