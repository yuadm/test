'use client';

import { useState, useEffect } from 'react';
import { User, Branch, UserFormData } from '@/types';
import { UserService } from '@/lib/services/user.service';
import { BranchService } from '@/lib/services/branch.service';
import { AuthService } from '@/lib/services/auth.service';
import { useRouter } from 'next/navigation';
import UserModal from './components/UserModal';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'password'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await AuthService.isAdmin();
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        // Redirect non-admin users away from this page
        router.push('/dashboard');
        return;
      }
      
      // Load data only if user is admin
      loadData();
    };
    
    checkAdmin();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Fetch users
      const usersResponse = await UserService.getUsers();
      if (usersResponse.error) {
        alert(usersResponse.error);
      } else if (usersResponse.data) {
        setUsers(usersResponse.data);
      }
      
      // Fetch branches for the branch selection dropdown
      const branchesResponse = await BranchService.getAllBranches();
      if (branchesResponse.error) {
        alert(branchesResponse.error);
      } else if (branchesResponse.data) {
        setBranches(branchesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setModalMode('password');
    setModalOpen(true);
  };

  const handleToggleUserStatus = async (user: User) => {
    // This functionality is removed as is_disabled field doesn't exist in the schema
    alert('User status toggle functionality is not available in this version.');
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      const { error } = await UserService.deleteUser(userToDelete.id);
      
      if (error) {
        alert(error);
      } else {
        alert('User deleted successfully');
        setConfirmDeleteOpen(false);
        setUserToDelete(null);
        loadData(); // Refresh the user list
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSaveUser = async (userData: UserFormData) => {
    try {
      if (modalMode === 'create') {
        // Create new user
        const { data, error } = await UserService.createUser(userData);
        
        if (error) {
          alert(error);
        } else {
          alert('User created successfully');
          setModalOpen(false);
          loadData(); // Refresh the user list
        }
      } else if (modalMode === 'edit' && selectedUser) {
        // Update existing user
        const { data, error } = await UserService.updateUser(selectedUser.id, userData);
        
        if (error) {
          alert(error);
        } else {
          alert('User updated successfully');
          setModalOpen(false);
          loadData(); // Refresh the user list
        }
      } else if (modalMode === 'password' && selectedUser) {
        // Reset user password
        const { error } = await UserService.resetPassword(selectedUser.id, userData.password);
        
        if (error) {
          alert(error);
        } else {
          alert('Password reset successfully');
          setModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user data');
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything while checking admin status or redirecting
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <button
            onClick={handleCreateUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            Create New User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {users.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrator' : 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {user.branch?.name || (user.role === 'admin' ? 'N/A' : 'Not assigned')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Reset
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* User Modal for Create/Edit/Reset Password */}
        <UserModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveUser}
          mode={modalMode}
          user={selectedUser}
          branches={branches}
        />

        {/* Confirmation Dialog for Delete */}
        {confirmDeleteOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete the user {userToDelete?.email}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
