'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/lib/services/leave.service';
import { createClient } from '@/lib/supabase/client';
import type { Leave, Profile } from '@/types';
import Modal from '@/components/Modal';

interface LeaveViewModalProps {
  leaveId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaveViewModal({ leaveId, isOpen, onClose }: LeaveViewModalProps) {
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdByUser, setCreatedByUser] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');

  useEffect(() => {
    async function loadLeaveData() {
      if (!leaveId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch leave details
        const { data: leaveData, error: leaveError } = await LeaveService.getLeaveById(leaveId);
        
        if (leaveError) {
          throw new Error(leaveError);
        }
        
        if (leaveData) {
          setLeave(leaveData);
          
          // Set created by user info
          if (leaveData.created_by) {
            setCreatedByUser(leaveData.created_by);
            
            // Fetch the creator's profile to get their name
            try {
              const supabase = createClient();
              const { data: userData } = await supabase
                .from('users')
                .select('email')
                .eq('id', leaveData.created_by)
                .single();
                
              if (userData && userData.email) {
                // Use email as the creator name (or extract name from email)
                const emailName = userData.email.split('@')[0];
                const formattedName = emailName
                  .split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
                setCreatorName(formattedName);
              }
            } catch (err) {
              console.error('Error fetching creator info:', err);
            }
          } else {
            setCreatedByUser('Unknown User');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load leave details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen && leaveId) {
      loadLeaveData();
    }
  }, [leaveId, isOpen]);

  // Format date to dd/mm/yyyy
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Details"
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      ) : leave ? (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Name:</span> {leave.employee?.full_name || leave.employees?.full_name || '-'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Employee Code:</span> {leave.employee?.employee_code || leave.employees?.employee_code || '-'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Branch:</span> {leave.employee?.branch?.name || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee ID:</span> {leave.employee_id || '-'}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-sm text-gray-600 mr-2">Type:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    leave.leave_type === 'Annual' ? 'bg-green-100 text-green-800' : 
                    leave.leave_type === 'Sick' ? 'bg-red-100 text-red-800' : 
                    leave.leave_type === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {leave.leave_type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Start Date:</span> {formatDate(leave.start_date)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">End Date:</span> {formatDate(leave.end_date)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Duration:</span> {leave.duration} {leave.duration === 1 ? 'day' : 'days'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Status:</span> 
                  <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Approved
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Notes:</span> {leave.notes || '-'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Created By:</span> {creatorName || createdByUser || '-'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Created At:</span> {formatDate(leave.created_at)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last Updated:</span> {formatDate(leave.created_at)}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-600">
          <p>No leave record found.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}
