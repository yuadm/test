'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveForm from '../components/LeaveForm';

export default function AddLeavePage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Leave</h1>
        <p className="text-gray-600">Create a new leave record</p>
      </div>
      
      <LeaveForm />
    </DashboardLayout>
  );
}
