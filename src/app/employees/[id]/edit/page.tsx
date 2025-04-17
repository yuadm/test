'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeForm from '../../components/EmployeeForm';

export default function EditEmployeePage() {
  const params = useParams();
  const employeeId = params.id as string;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-600">Update employee information</p>
      </div>
      
      <EmployeeForm employeeId={employeeId} isEdit={true} />
    </DashboardLayout>
  );
}
