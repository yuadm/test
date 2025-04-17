'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeForm from '../components/EmployeeForm';

export default function AddEmployeePage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-600">Create a new employee record</p>
      </div>
      
      <EmployeeForm />
    </DashboardLayout>
  );
}
