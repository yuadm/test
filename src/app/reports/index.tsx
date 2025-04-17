'use client';

import React from 'react';

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Reports</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          View and generate reports for leave management across the organization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Report Card 1 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Leave Summary</h3>
                <p className="text-sm text-gray-500">Summary of all leave types by department</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Card 2 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Monthly Overview</h3>
                <p className="text-sm text-gray-500">Monthly leave patterns and trends</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Card 3 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">Employee Leave</h3>
                <p className="text-sm text-gray-500">Individual employee leave records</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Scheduled Reports</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Reports that are automatically generated and sent.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Generated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Monthly Summary</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Monthly</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">HR Department</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">April 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Weekly Absence</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Weekly</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Department Managers</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">April 5, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
