'use client';

import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useRouter } from 'next/navigation';

type HeaderProps = {
  userName?: string;
  userEmail?: string;
};

export default function Header({ userName = 'Admin User', userEmail = 'admin@example.com' }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      // Redirect to login page after sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 py-4">
      <div className="flex items-center">
        {/* Mobile menu button (hidden on desktop) */}
        <button type="button" className="md:hidden mr-4 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Date display */}
        <div className="hidden md:flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        
        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center space-x-2 focus:outline-none"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium shadow-sm">
              {userName.charAt(0)}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">{userName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Dropdown menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-100 transform transition-all duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
