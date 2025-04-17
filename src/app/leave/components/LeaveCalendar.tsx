'use client';

import { useState, useEffect } from 'react';
import { LeaveService } from '@/lib/services/leave.service';
import type { Leave, LeaveType } from '@/types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  leaves: Leave[];
}

interface LeaveCalendarProps {
  branchId?: string;
  month?: Date;
}

export default function LeaveCalendar({ branchId, month = new Date() }: LeaveCalendarProps) {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(month);
  const [isLoading, setIsLoading] = useState(true);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get color for leave type
  const getLeaveTypeColor = (leaveType: LeaveType): string => {
    switch (leaveType) {
      case 'Annual':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Sick':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Working':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Load leaves for the current month
  useEffect(() => {
    async function loadLeaves() {
      try {
        setIsLoading(true);
        
        // Calculate start and end dates for the month
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Format dates for API
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Get leaves for the date range
        const { data, error: leaveError } = await LeaveService.getLeaves({
          branch_id: branchId,
          start_date: startDateStr,
          end_date: endDateStr
        });
        
        if (leaveError) {
          throw new Error(leaveError);
        }
        
        setLeaves(data || []);
        generateCalendarDays(startDate, endDate, data || []);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load leave data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadLeaves();
  }, [currentMonth, branchId]);
  
  // Generate calendar days for the current month
  const generateCalendarDays = (startDate: Date, endDate: Date, leaveData: Leave[]) => {
    const days: CalendarDay[] = [];
    
    // Get the first day of the month
    const firstDay = new Date(startDate);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from the previous month to fill the first week
    const prevMonthEnd = new Date(firstDay);
    prevMonthEnd.setDate(0); // Last day of previous month
    const prevMonthDays = prevMonthEnd.getDate();
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonthEnd);
      date.setDate(prevMonthDays - i);
      
      // Find leaves for this day
      const dayLeaves = leaveData.filter(leave => {
        const leaveStart = new Date(leave.start_date);
        const leaveEnd = new Date(leave.end_date);
        return date >= leaveStart && date <= leaveEnd;
      });
      
      days.push({
        date,
        isCurrentMonth: false,
        leaves: dayLeaves
      });
    }
    
    // Add days for the current month
    const daysInMonth = endDate.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(startDate);
      date.setDate(i);
      
      // Find leaves for this day
      const dayLeaves = leaveData.filter(leave => {
        const leaveStart = new Date(leave.start_date);
        const leaveEnd = new Date(leave.end_date);
        return date >= leaveStart && date <= leaveEnd;
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        leaves: dayLeaves
      });
    }
    
    // Add days from the next month to complete the last week
    const lastDayOfWeek = new Date(endDate).getDay();
    const daysToAdd = 6 - lastDayOfWeek;
    
    // Add days from next month
    for (let i = 1; i <= daysToAdd; i++) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() + i);
      
      // Find leaves for this day
      const dayLeaves = leaveData.filter(leave => {
        const leaveStart = new Date(leave.start_date);
        const leaveEnd = new Date(leave.end_date);
        return date >= leaveStart && date <= leaveEnd;
      });
      
      days.push({
        date,
        isCurrentMonth: false,
        leaves: dayLeaves
      });
    }
    
    setCalendarDays(days);
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Format date as day number
  const formatDay = (date: Date) => {
    return date.getDate();
  };
  
  // Get month name and year
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Leave Calendar</h3>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white">
            {getMonthName(currentMonth)}
          </span>
          <button
            onClick={goToNextMonth}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Sun</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Mon</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Tue</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Wed</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Thu</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Fri</div>
          <div className="bg-gray-100 text-center py-2 font-medium text-gray-500">Sat</div>
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`bg-white min-h-[100px] p-2 ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${
                  new Date().toDateString() === day.date.toDateString() 
                    ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                    : ''
                }`}>
                  {formatDay(day.date)}
                </span>
                {day.leaves.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-1">
                    {day.leaves.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {day.leaves.slice(0, 3).map((leave, idx) => (
                  <div 
                    key={`${leave.id}-${idx}`} 
                    className={`text-xs px-2 py-1 rounded truncate border ${getLeaveTypeColor(leave.leave_type)}`}
                    title={`${leave.employee?.full_name || 'Employee'} - ${leave.leave_type}`}
                  >
                    {leave.employee?.full_name || 'Employee'}
                  </div>
                ))}
                {day.leaves.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{day.leaves.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
