"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building, Users, MapPin, Phone, Mail, Pencil } from "lucide-react"
import { PermissionCheck } from "@/components/permission-check"

// Mock data for branches
const initialBranches = [
  {
    id: 1,
    name: "Lambeth",
    address: "123 Lambeth Road, London",
    phone: "020 1234 5678",
    email: "lambeth@example.com",
    employees: 12,
    manager: "Jane Cooper",
  },
  {
    id: 2,
    name: "Waltham",
    address: "456 Waltham Avenue, London",
    phone: "020 2345 6789",
    email: "waltham@example.com",
    employees: 8,
    manager: "Robert Fox",
  },
  {
    id: 3,
    name: "Haringey",
    address: "789 Haringey Street, London",
    phone: "020 3456 7890",
    email: "haringey@example.com",
    employees: 15,
    manager: "Albert Flores",
  },
  {
    id: 4,
    name: "Islington",
    address: "101 Islington Road, London",
    phone: "020 4567 8901",
    email: "islington@example.com",
    employees: 10,
    manager: "Leslie Alexander",
  },
]

// Mock data for employees
const initialEmployees = [
  {
    id: 1,
    name: "Jane Cooper",
    position: "Branch Manager",
    branch: "Lambeth",
    email: "jane@example.com",
    phone: "020 1111 2222",
  },
  {
    id: 2,
    name: "Robert Fox",
    position: "Branch Manager",
    branch: "Waltham",
    email: "robert@example.com",
    phone: "020 2222 3333",
  },
  {
    id: 3,
    name: "Albert Flores",
    position: "Branch Manager",
    branch: "Haringey",
    email: "albert@example.com",
    phone: "020 3333 4444",
  },
  {
    id: 4,
    name: "Leslie Alexander",
    position: "Branch Manager",
    branch: "Islington",
    email: "leslie@example.com",
    phone: "020 4444 5555",
  },
  {
    id: 5,
    name: "John Smith",
    position: "Sales Associate",
    branch: "Lambeth",
    email: "john@example.com",
    phone: "020 5555 6666",
  },
  {
    id: 6,
    name: "Emily Johnson",
    position: "Customer Service",
    branch: "Lambeth",
    email: "emily@example.com",
    phone: "020 6666 7777",
  },
  {
    id: 7,
    name: "Michael Brown",
    position: "Sales Associate",
    branch: "Waltham",
    email: "michael@example.com",
    phone: "020 7777 8888",
  },
  {
    id: 8,
    name: "Sarah Davis",
    position: "Customer Service",
    branch: "Haringey",
    email: "sarah@example.com",
    phone: "020 8888 9999",
  },
]

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [editBranchDialog, setEditBranchDialog] = useState(false)
  const [currentBranch, setCurrentBranch] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
  })
  const [userBranches, setUserBranches] = useState<string[]>([])

  // Load data from localStorage or use initial data
  useEffect(() => {
    const storedBranches = localStorage.getItem("branches")
    const storedEmployees = localStorage.getItem("employees")

    if (storedBranches) {
      setBranches(JSON.parse(storedBranches))
    } else {
      setBranches(initialBranches)
      localStorage.setItem("branches", JSON.stringify(initialBranches))
    }

    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees))
    } else {
      setEmployees(initialEmployees)
      localStorage.setItem("employees", JSON.stringify(initialEmployees))
    }

    // Get user's assigned branches
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUserBranches(user.branches || [])
    }
  }, [])

  // Save data to localStorage whenever they change
  useEffect(() => {
    if (branches.length > 0) {
      localStorage.setItem("branches", JSON.stringify(branches))
    }
    if (employees.length > 0) {
      localStorage.setItem("employees", JSON.stringify(employees))
    }
  }, [branches, employees])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEditBranch = () => {
    if (!currentBranch) return

    const updatedBranches = branches.map((branch) =>
      branch.id === currentBranch.id
        ? {
            ...branch,
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            manager: formData.manager,
          }
        : branch,
    )

    setBranches(updatedBranches)
    setEditBranchDialog(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      manager: "",
    })
    setCurrentBranch(null)
  }

  const openEditDialog = (branch: any) => {
    setCurrentBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
    })
    setEditBranchDialog(true)
  }

  // Filter branches based on user's assigned branches
  const filteredBranches = branches.filter((branch) => {
    // If user has 'all' branch access, show all branches
    if (userBranches.includes("all")) {
      return true
    }
    // Otherwise, only show branches the user has access to
    return userBranches.includes(branch.name.toLowerCase())
  })

  // Filter employees based on selected branch and user's branch access
  const filteredEmployees = employees.filter((employee) => {
    // First check if user has access to this employee's branch
    const hasAccess = userBranches.includes("all") || userBranches.includes(employee.branch.toLowerCase())

    if (!hasAccess) {
      return false
    }

    // Then filter by selected branch if not "all"
    return selectedBranch === "all" || employee.branch.toLowerCase() === selectedBranch.toLowerCase()
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Branch Management</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredBranches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{branch.name}</CardTitle>
              <Building className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                {branch.address}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-gray-500" />
                {branch.phone}
              </div>
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                {branch.email}
              </div>
              <div className="flex items-center text-sm">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                {branch.employees} Employees
              </div>
              <PermissionCheck module="branches" permission="edit">
                <div className="pt-2">
                  <Button variant="outline" className="w-full" onClick={() => openEditDialog(branch)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Branch
                  </Button>
                </div>
              </PermissionCheck>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <Tabs value={selectedBranch} onValueChange={setSelectedBranch} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {filteredBranches.map((branch) => (
                <TabsTrigger key={branch.id} value={branch.name.toLowerCase()}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.branch}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No employees found for the selected branch or you don't have permission to view them.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Branch Dialog */}
      <Dialog open={editBranchDialog} onOpenChange={setEditBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Branch Name</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-manager">Branch Manager</Label>
              <Input id="edit-manager" name="manager" value={formData.manager} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBranchDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBranch}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
