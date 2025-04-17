'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardService } from '@/lib/services/dashboard.service';
import { LeaveService } from '@/lib/services/leave.service';
import { AuthService } from '@/lib/services/auth.service';
import type { Leave } from '@/types';

interface BranchSummary {
  id: string;
  name: string;
  employee_count: number;
  leave_count: number;
  leave_days: number;
}

interface DashboardSummary {
  totalEmployees: number;
  leaveToday: number;
  leaveThisMonth: number;
  sickLeaveCount: number;
  leaveSummary: {
    annual: number;
    sick: number;
    unpaid: number;
    working: number;
  };
  recentLeaves: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
  }[];
  upcomingLeave: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
  }[];
}

// Dashboard summary card component
function SummaryCard({ title, value, icon, color }: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
}): React.ReactElement {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-b-4 ${color}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-full p-3 ${color.replace('border-', 'bg-').replace('500', '100')} ${color.replace('border-', 'text-')}`}>
            {icon}
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [branchSummaries, setBranchSummaries] = useState<BranchSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Format date to dd/mm/yyyy
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user is admin
        const adminStatus = await AuthService.isAdmin();
        setIsAdmin(adminStatus);
        
        // Load dashboard summary
        const { data: summary, error: summaryError } = await DashboardService.getDashboardSummary();
        if (summaryError) {
          setError(summaryError);
          setIsLoading(false);
          return;
        }
        
        if (summary) {
          setDashboardSummary(summary as any);
        }
        
        // Load branch summaries for admin
        if (adminStatus) {
          const { data: branchData, error: branchError } = await DashboardService.getBranchSummaries();
          if (branchError) {
            console.error("Branch summaries error:", branchError);
            setError(branchError);
            setIsLoading(false);
            return;
          }
          
          if (branchData) {
            setBranchSummaries(branchData as any);
          }
        }
        
      } catch (err: any) {
        console.error("Dashboard data loading error:", err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : dashboardSummary ? (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <SummaryCard 
                title="Total Employees" 
                value={dashboardSummary.totalEmployees} 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                } 
                color="border-blue-500" 
              />
              <SummaryCard 
                title="Employees on Leave Today" 
                value={dashboardSummary.leaveToday} 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                } 
                color="border-green-500" 
              />
              <SummaryCard 
                title="Leaves This Month" 
                value={dashboardSummary.leaveThisMonth} 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                } 
                color="border-purple-500" 
              />
              <SummaryCard 
                title="Sick Leave Count" 
                value={dashboardSummary.sickLeaveCount} 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } 
                color="border-yellow-500" 
              />
            </div>
            
            {/* Branch Summaries (Admin only) */}
            {isAdmin && branchSummaries.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch Summaries</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {branchSummaries.map((branch) => {
                    // Generate a unique gradient color for each branch
                    const gradientColors = [
                      'from-blue-500 to-indigo-600',
                      'from-emerald-500 to-teal-600',
                      'from-violet-500 to-purple-600',
                      'from-rose-500 to-pink-600',
                      'from-amber-500 to-orange-600'
                    ];
                    const colorIndex = branch.id.charCodeAt(0) % gradientColors.length;
                    const gradientColor = gradientColors[colorIndex];
                    
                    return (
                      <div key={branch.id} className="relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        {/* Gradient header */}
                        <div className={`h-24 bg-gradient-to-r ${gradientColor} flex items-center justify-center`}>
                          <h3 className="text-xl font-bold text-white">{branch.name}</h3>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            {/* Employees */}
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="text-2xl font-bold text-gray-800">{branch.employee_count}</span>
                              <span className="text-xs text-gray-500">{branch.employee_count === 1 ? 'employee' : 'employees'}</span>
                            </div>
                            
                            {/* Leaves */}
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 mb-2 rounded-full bg-green-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-2xl font-bold text-gray-800">{branch.leave_count}</span>
                              <span className="text-xs text-gray-500">{branch.leave_count === 1 ? 'leave' : 'leaves'}</span>
                            </div>
                            
                            {/* Days */}
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-2xl font-bold text-gray-800">{branch.leave_days}</span>
                              <span className="text-xs text-gray-500">{branch.leave_days === 1 ? 'day' : 'days'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mt-4" role="alert">
            <strong className="font-bold">No data: </strong>
            <span className="block sm:inline">No dashboard data available.</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
