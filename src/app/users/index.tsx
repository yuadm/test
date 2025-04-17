'use client';

import React, { useState } from 'react';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock user data for UI demonstration
  const users = [
    { id: 1, name: 'John Smith', email: 'john.smith@example.com', role: 'admin', branch: 'Head Office' },
    { id: 2, name: 'Jane Doe', email: 'jane.doe@example.com', role: 'user', branch: 'Head Office' },
    { id: 3, name: 'Robert Johnson', email: 'robert.johnson@example.com', role: 'user', branch: 'North Branch' },
    { id: 4, name: 'Emily Williams', email: 'emily.williams@example.com', role: 'user', branch: 'North Branch' },
    { id: 5, name: 'Michael Brown', email: 'michael.brown@example.com', role: 'user', branch: 'South Branch' },
    { id: 6, name: 'Sarah Davis', email: 'sarah.davis@example.com', role: 'user', branch: 'South Branch' },
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Users</h1>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-base font-semibold leading-6 text-gray-900">User Management</h3>
              <p className="mt-2 text-sm text-gray-700">
                A list of all users in the system including their name, email, role, and branch.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Branch</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{user.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.branch}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                          No users found matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
