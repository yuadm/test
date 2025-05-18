"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff } from "lucide-react"

export default function PermissionsExample() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const storedUsers = localStorage.getItem("users")
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    }
  }, [])

  const toggleBranchVisibility = (userId: number) => {
    const updatedUsers = users.map((user) => {
      if (user.id === userId) {
        // Create a copy of the user's permissions
        const updatedPermissions = { ...user.permissions }

        // If the user has branches.view permission, remove it
        // Otherwise, add it
        if (updatedPermissions.branches?.includes("view")) {
          updatedPermissions.branches = updatedPermissions.branches.filter((p: string) => p !== "view")
        } else {
          updatedPermissions.branches = [...(updatedPermissions.branches || []), "view"]
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

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Sidebar Visibility Control</CardTitle>
        <CardDescription>Control which sidebar items users can see by toggling their permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Can See Branches</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                  {user.permissions?.branches?.includes("view") ? (
                    <span className="inline-flex items-center text-green-600">
                      <Eye className="mr-1 h-4 w-4" /> Visible
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <EyeOff className="mr-1 h-4 w-4" /> Hidden
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => toggleBranchVisibility(user.id)}>
                    {user.permissions?.branches?.includes("view") ? "Hide Branches" : "Show Branches"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
