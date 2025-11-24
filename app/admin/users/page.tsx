"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchUsers, createUser, updateUser, deleteUser } from "@/lib/api-client"

interface User {
  _id?: string
  name: string
  email: string
  role: string
  status: string
  joinDate?: string
}

export default function UsersManagement() {
  const [selectedRole, setSelectedRole] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "farmer",
    status: "active",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const data = await fetchUsers()
      // Map MongoDB data to expected format
      const mappedUsers = data.map((u: any) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        joinDate: u.joinDate
          ? new Date(u.joinDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }))
      setUsers(mappedUsers)
    } catch (error) {
      console.error("Failed to load users:", error)
      alert("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers =
    selectedRole === "all" ? users : users.filter((u) => u.role.toLowerCase() === selectedRole.toLowerCase())

  const handleAddUser = () => {
    setFormData({
      name: "",
      email: "",
      role: "farmer",
      status: "active",
    })
    setSelectedUser(null)
    setIsAddModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedUser && selectedUser._id) {
      try {
        console.log("Deleting user with ID:", selectedUser._id)
        const result = await deleteUser(selectedUser._id)
        console.log("Delete result:", result)
        
        // Reload users list to ensure consistency
        await loadUsers()
        
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
        alert("User deleted successfully!")
      } catch (error: any) {
        console.error("Failed to delete user:", error)
        const errorMessage = error.message || "Failed to delete user. Please try again."
        alert(errorMessage)
      }
    } else {
      alert("No user selected for deletion")
    }
  }

  const saveUser = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in all fields")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    try {
      if (selectedUser && selectedUser._id) {
        await updateUser(selectedUser._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role.toLowerCase(),
          status: formData.status,
        })
        setUsers(
          users.map((u) =>
            u._id === selectedUser._id
              ? {
                  ...u,
                  name: formData.name,
                  email: formData.email,
                  role: formData.role.toLowerCase(),
                  status: formData.status,
                }
              : u,
          ),
        )
        setIsEditModalOpen(false)
      } else {
        const newUser = await createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role.toLowerCase(),
          status: formData.status,
          joinDate: new Date(),
        })
        setUsers([
          ...users,
          {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            joinDate: new Date().toISOString().split("T")[0],
          },
        ])
        setIsAddModalOpen(false)
      }
      setSelectedUser(null)
    } catch (error: any) {
      console.error("Failed to save user:", error)
      const errorMessage = error.message || "Failed to save user. Please try again."
      alert(errorMessage)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700 text-white">
          Add New User
        </Button>
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="flex gap-2 mb-6">
          {["all", "farmer", "customer", "delivery", "admin"].map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role)}
              className={selectedRole === role ? "bg-green-600 text-white" : ""}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}s
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Join Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.role}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.joinDate}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      onClick={() => handleEditUser(user)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(user)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 bg-transparent"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter the details for the new user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="farmer">Farmer</option>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveUser} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Add User
              </Button>
              <Button onClick={() => setIsAddModalOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="farmer">Farmer</option>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveUser} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Save Changes
              </Button>
              <Button onClick={() => setIsEditModalOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
            <Button onClick={() => setIsDeleteModalOpen(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
