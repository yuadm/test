"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Key, Trash, Shield } from "lucide-react"
import SidebarVisibility from "./sidebar-visibility"

// Define permission types
const permissionTypes = {
  view: {
    label: "View",
    description: "Can view information",
  },
  create: {
    label: "Create",
    description: "Can create new entries",
  },
  edit: {
    label: "Edit",
    description: "Can edit existing entries",
  },
  delete: {
    label: "Delete",
    description: "Can delete entries",
  },
}

// Define permission modules
const permissionModules = {
  users: {
    label: "Users",
    description: "User management permissions",
  },
  branches: {
    label: "Branches",
    description: "Branch management permissions",
  },
  employees: {
    label: "Employees",
    description: "Employee management permissions",
  },
  settings: {
    label: "Settings",
    description: "System settings permissions",
  },
}

// Mock data for users
const initialUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    branches: ["all"],
    status: "active",
    permissions: {
      users: ["view", "create", "edit", "delete"],
      branches: ["view", "create", "edit", "delete"],
      employees: ["view", "create", "edit", "delete"],
      settings: ["view", "edit"],
    },
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    branches: ["lambeth"],
    status: "active",
    permissions: {
      users: [],
      branches: ["view"],
      employees: ["view", "create", "edit"],
      settings: [],
    },
  },
  {
    id: 3,
    name: "Sarah Smith",
    email: "sarah@example.com",
    role: "user",
    branches: ["waltham", "haringey"],
    status: "active",
    permissions: {
      users: [],
      branches: ["view"],
      employees: ["view", "edit"],
      settings: [],
    },
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [newUserDialog, setNewUserDialog] = useState(false)
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [permissionsDialog, setPermissionsDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    branches: [] as string[],
    permissions: {
      users: [] as string[],
      branches: [] as string[],
      employees: [] as string[],
      settings: [] as string[],
    },
  })

  // Load users from localStorage or use initial data
  useEffect(() => {
    const storedUsers = localStorage.getItem("users")
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    } else {
      setUsers(initialUsers)
      localStorage.setItem("users", JSON.stringify(initialUsers))
    }
  }, [])

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("users", JSON.stringify(users))
    }
  }, [users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRoleChange = (value: string) => {
    // If changing to admin, set all permissions
    if (value === "admin") {
      setFormData({
        ...formData,
        role: value,
        permissions: {
          users: ["view", "create", "edit", "delete"],
          branches: ["view", "create", "edit", "delete"],
          employees: ["view", "create", "edit", "delete"],
          settings: ["view", "edit"],
        },
      })
    } else {
      setFormData({
        ...formData,
        role: value,
        permissions: {
          users: [],
          branches: ["view"],
          employees: ["view"],
          settings: [],
        },
      })
    }
  }

  const handleBranchToggle = (branch: string) => {
    setFormData((prev) => {
      const branches = prev.branches.includes(branch)
        ? prev.branches.filter((b) => b !== branch)
        : [...prev.branches, branch]

      return {
        ...prev,
        branches,
      }
    })
  }

  const handlePermissionToggle = (module: string, permission: string) => {
    setFormData((prev) => {
      const modulePermissions = prev.permissions[module as keyof typeof prev.permissions] || []
      const updatedPermissions = modulePermissions.includes(permission)
        ? modulePermissions.filter((p) => p !== permission)
        : [...modulePermissions, permission]

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: updatedPermissions,
        },
      }
    })
  }

  const handleAddUser = () => {
    const newUser = {
      id: users.length + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      branches: formData.branches.length ? formData.branches : ["all"],
      status: "active",
      permissions: formData.permissions,
    }

    setUsers([...users, newUser])
    setNewUserDialog(false)
    resetForm()
  }

  const handleEditUser = () => {
    if (!currentUser) return

    const updatedUsers = users.map((user) =>
      user.id === currentUser.id
        ? {
            ...user,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            branches: formData.branches.length ? formData.branches : ["all"],
          }
        : user,
    )

    setUsers(updatedUsers)
    setEditUserDialog(false)
    resetForm()
  }

  const handleUpdatePermissions = () => {
    if (!currentUser) return

    const updatedUsers = users.map((user) =>
      user.id === currentUser.id
        ? {
            ...user,
            permissions: formData.permissions,
          }
        : user,
    )

    setUsers(updatedUsers)
    setPermissionsDialog(false)
    resetForm()
  }

  const handleChangePassword = () => {
    if (!currentUser || !formData.password) return

    // In a real app, you would hash the password
    setPasswordDialog(false)
    resetForm()
  }

  const handleDeleteUser = (id: number) => {
    if (id === 1) {
      alert("Cannot delete the main admin user")
      return
    }

    const updatedUsers = users.filter((user) => user.id !== id)
    setUsers(updatedUsers)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      branches: [],
      permissions: {
        users: [],
        branches: [],
        employees: [],
        settings: [],
      },
    })
    setCurrentUser(null)
  }

  const openEditDialog = (user: any) => {
    setCurrentUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      branches: user.branches,
      permissions: user.permissions || {
        users: [],
        branches: [],
        employees: [],
        settings: [],
      },
    })
    setEditUserDialog(true)
  }

  const openPasswordDialog = (user: any) => {
    setCurrentUser(user)
    setFormData({
      ...formData,
      password: "",
    })
    setPasswordDialog(true)
  }

  const openPermissionsDialog = (user: any) => {
    setCurrentUser(user)
    setFormData({
      ...formData,
      permissions: user.permissions || {
        users: [],
        branches: [],
        employees: [],
        settings: [],
      },
    })
    setPermissionsDialog(true)
  }

  const branchOptions = ["lambeth", "waltham", "haringey", "islington", "all"]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with specific permissions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assigned Branches</Label>
                <div className="grid grid-cols-2 gap-2">
                  {branchOptions.map((branch) => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={`branch-${branch}`}
                        checked={formData.branches.includes(branch)}
                        onCheckedChange={() => handleBranchToggle(branch)}
                      />
                      <Label htmlFor={`branch-${branch}`} className="capitalize">
                        {branch}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="user">Regular Users</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell className="capitalize">{user.branches.join(", ")}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(user)}>
                            <Shield className="h-4 w-4" />
                            <span className="sr-only">Permissions</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)}>
                            <Key className="h-4 w-4" />
                            <span className="sr-only">Change Password</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((user) => user.role === "admin")
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.branches.join(", ")}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(user)}>
                              <Shield className="h-4 w-4" />
                              <span className="sr-only">Permissions</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)}>
                              <Key className="h-4 w-4" />
                              <span className="sr-only">Change Password</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((user) => user.role === "user")
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.branches.join(", ")}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(user)}>
                              <Shield className="h-4 w-4" />
                              <span className="sr-only">Permissions</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)}>
                              <Key className="h-4 w-4" />
                              <span className="sr-only">Change Password</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assigned Branches</Label>
              <div className="grid grid-cols-2 gap-2">
                {branchOptions.map((branch) => (
                  <div key={branch} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-branch-${branch}`}
                      checked={formData.branches.includes(branch)}
                      onCheckedChange={() => handleBranchToggle(branch)}
                    />
                    <Label htmlFor={`edit-branch-${branch}`} className="capitalize">
                      {branch}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialog} onOpenChange={setPermissionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {currentUser?.name}. These settings control what actions the user can perform in
              different areas of the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {Object.entries(permissionModules).map(([moduleKey, moduleValue]) => (
              <div key={moduleKey} className="space-y-3">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  {moduleValue.label}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(permissionTypes).map(([permKey, permValue]) => (
                    <div key={`${moduleKey}-${permKey}`} className="flex items-start space-x-2">
                      <Checkbox
                        id={`perm-${moduleKey}-${permKey}`}
                        checked={formData.permissions[moduleKey as keyof typeof formData.permissions]?.includes(
                          permKey,
                        )}
                        onCheckedChange={() => handlePermissionToggle(moduleKey, permKey)}
                      />
                      <div className="grid gap-0.5">
                        <Label htmlFor={`perm-${moduleKey}-${permKey}`} className="text-sm font-medium">
                          {permValue.label}
                        </Label>
                        <span className="text-xs text-gray-500">{permValue.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions}>Save Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {currentUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Visibility Control */}
      <SidebarVisibility />
    </motion.div>
  )
}
