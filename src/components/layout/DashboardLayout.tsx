'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthService } from '@/lib/services/auth.service';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setIsLoading(true);
        // Get current user
        const user = await AuthService.getCurrentUser();
        
        if (user) {
          setUserRole(user.role || 'user');
          setUserEmail(user.email || '');
          
          // Format user name from email (remove @gmail.com)
          if (user.email) {
            const name = user.email.split('@')[0];
            // Convert to title case (capitalize first letter of each word)
            const formattedName = name
              .split(/[._-]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setUserName(formattedName);
          }
          
          // Set branch name based on user role and branch
          if (user.role === 'admin') {
            setBranchName('All Branches');
          } else if (user.branch) {
            setBranchName(user.branch.name);
          } else {
            setBranchName('No Branch Assigned');
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserInfo();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar userRole={userRole} branchName={branchName} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header userName={userName} userEmail={userEmail} />
        
        <main className="flex-1 p-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
