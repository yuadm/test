'use client';

import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Settings, LeaveYear } from '@/types';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Leave year state
  const [currentLeaveYear, setCurrentLeaveYear] = useState<LeaveYear | null>(null);
  const [newLeaveYear, setNewLeaveYear] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch settings and current leave year on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();
        
        if (settingsError) {
          console.error('Error fetching settings:', settingsError);
          toast.error('Failed to load settings');
        } else if (settingsData) {
          setSettings(settingsData as Settings);
        }
        
        // Fetch current leave year
        const { data: leaveYearData, error: leaveYearError } = await supabase
          .from('leave_years')
          .select('*')
          .eq('is_current', true)
          .single();
        
        if (leaveYearError) {
          console.error('Error fetching leave year:', leaveYearError);
          toast.error('Failed to load current leave year');
        } else if (leaveYearData) {
          setCurrentLeaveYear(leaveYearData as LeaveYear);
          setNewLeaveYear({
            startDate: leaveYearData.start_date,
            endDate: leaveYearData.end_date
          });
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (settings) {
      setSettings({
        ...settings,
        [name]: type === 'checkbox' ? checked : value
      } as Settings);
    }
  };

  const handleLeaveYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLeaveYear({
      ...newLeaveYear,
      [name]: value
    });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Save settings
      const { error: settingsError } = await supabase
        .from('settings')
        .update({
          company_name: settings.company_name,
          fiscal_year_start: settings.fiscal_year_start,
          default_leave_allocation: settings.default_leave_allocation,
          sick_leave_allocation: settings.sick_leave_allocation,
          email_notifications: settings.email_notifications
        } as any)
        .eq('id', settings.id);
      
      if (settingsError) {
        throw new Error('Failed to save settings');
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLeaveYear = async () => {
    if (!currentLeaveYear) return;
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // Update current leave year
      const { error: leaveYearError } = await supabase
        .from('leave_years')
        .update({
          start_date: newLeaveYear.startDate,
          end_date: newLeaveYear.endDate
        })
        .eq('id', currentLeaveYear.id);
      
      if (leaveYearError) {
        throw new Error('Failed to update leave year');
      }
      
      // Update the current leave year state
      setCurrentLeaveYear({
        ...currentLeaveYear,
        start_date: newLeaveYear.startDate,
        end_date: newLeaveYear.endDate
      });
      
      toast.success('Leave year updated successfully');
    } catch (error) {
      console.error('Error updating leave year:', error);
      toast.error('Failed to update leave year');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLeaveBalances = async () => {
    if (window.confirm('Are you sure you want to reset leave balances for all active employees? This action cannot be undone.')) {
      setIsResetting(true);
      try {
        const supabase = createClient();
        
        // Get default leave allocation from settings
        const defaultLeaveAllocation = settings?.default_leave_allocation ? 
          parseInt(settings.default_leave_allocation, 10) : 28;
        
        // Get current leave year
        const { data: leaveYear, error: leaveYearError } = await supabase
          .from('leave_years')
          .select('id')
          .eq('is_current', true)
          .single();
        
        if (leaveYearError) {
          throw new Error('Failed to fetch current leave year');
        }
        
        // Get all active employees
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true);
        
        if (employeesError) {
          throw new Error('Failed to fetch employees');
        }
        
        if (!employees || employees.length === 0) {
          toast.error('No active employees found');
          return;
        }
        
        // Reset leave balances for all active employees
        // Using type assertion to avoid TypeScript errors
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            days_taken: 0,
            days_remaining: defaultLeaveAllocation
          } as any)
          .eq('is_active', true);
        
        if (updateError) {
          throw new Error('Failed to reset leave balances');
        }
        
        toast.success(`Successfully reset leave balances for ${employees.length} employees`);
      } catch (error: any) {
        console.error('Error resetting leave balances:', error);
        toast.error(error.message || 'Failed to reset leave balances');
      } finally {
        setIsResetting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Configure your application settings and preferences.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`${
                activeTab === 'leave'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Leave Settings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Notifications
            </button>
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'general' && settings && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">General Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Basic configuration for your organization.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="company_name"
                      id="company_name"
                      value={settings.company_name}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="fiscal_year_start" className="block text-sm font-medium text-gray-700">
                    Fiscal Year Start (MM-DD)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="fiscal_year_start"
                      id="fiscal_year_start"
                      value={settings.fiscal_year_start}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Leave Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Configure leave allocations and policies.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {settings && (
                  <>
                    <div className="sm:col-span-3">
                      <label htmlFor="default_leave_allocation" className="block text-sm font-medium text-gray-700">
                        Default Annual Leave (days)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="default_leave_allocation"
                          id="default_leave_allocation"
                          value={settings.default_leave_allocation}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="sick_leave_allocation" className="block text-sm font-medium text-gray-700">
                        Default Sick Leave (days)
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="sick_leave_allocation"
                          id="sick_leave_allocation"
                          value={settings.sick_leave_allocation}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="sm:col-span-6 border-t pt-6 mt-4">
                  <h4 className="text-md font-medium leading-6 text-gray-900">Current Leave Year</h4>
                  <p className="mt-1 text-sm text-gray-500 mb-4">
                    Modify the current leave year period.
                  </p>
                  
                  {currentLeaveYear && (
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Start Date (YYYY-MM-DD)
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            value={newLeaveYear.startDate}
                            onChange={handleLeaveYearChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          End Date (YYYY-MM-DD)
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            value={newLeaveYear.endDate}
                            onChange={handleLeaveYearChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:col-span-6">
                        <button
                          type="button"
                          onClick={handleUpdateLeaveYear}
                          disabled={isSaving}
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isSaving ? 'Updating...' : 'Update Leave Year'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="sm:col-span-6 mt-6 border-t pt-6">
                  <h4 className="text-md font-medium leading-6 text-gray-900">Leave Balance Management</h4>
                  <p className="mt-1 text-sm text-gray-500 mb-4">
                    Reset leave balances for all active employees. This will set each employee's annual leave balance to the default allocation value.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetLeaveBalances}
                    disabled={isResetting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isResetting ? 'Resetting...' : 'Reset All Leave Balances'}
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Note: This action will reset leave balances for all active employees. It cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && settings && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Configure how and when notifications are sent.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="email_notifications"
                      name="email_notifications"
                      type="checkbox"
                      checked={settings.email_notifications === 'true'}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          email_notifications: e.target.checked ? 'true' : 'false'
                        } as Settings);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email_notifications" className="font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-gray-500">Send email notifications for leave updates.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
