'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveForm from '../../components/LeaveForm';

export default function EditLeavePage() {
  const params = useParams();
  const leaveId = params.id as string;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Leave Record</h1>
        <p className="text-gray-600">Update leave information</p>
      </div>
      
      <LeaveForm leaveId={leaveId} isEdit={true} />
    </DashboardLayout>
  );
}
