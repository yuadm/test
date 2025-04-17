'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewDocumentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !documentType || !status) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setSubmitting(true);
    
    // Simulate successful submission
    setTimeout(() => {
      setSubmitting(false);
      alert('Document has been added successfully.');
      router.push('/tracker');
    }, 1000);
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add New Document</h1>
          <p className="text-gray-500">Create a new document record for an employee</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  id="employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select an employee</option>
                  <option value="1">John Doe (1001)</option>
                  <option value="2">Jane Smith (1002)</option>
                  <option value="3">Michael Johnson (1003)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select document type</option>
                  <option value="passport">Passport</option>
                  <option value="brp">BRP</option>
                  <option value="right_to_work">Right to Work</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select status</option>
                  <option value="BRITISH">BRITISH</option>
                  <option value="EU">EU</option>
                  <option value="NON-EU">NON-EU</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country of origin"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the document"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/tracker')}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {submitting ? 'Saving...' : 'Save Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
