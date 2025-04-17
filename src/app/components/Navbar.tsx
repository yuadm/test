"use client";

import React, { useState, useEffect } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Navbar = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Check if the current user is an admin and get user info
    const getUserInfo = async () => {
      // Check admin status
      const adminStatus = await AuthService.isAdmin();
      setIsAdmin(adminStatus);
      
      // Get current user
      const user = await AuthService.getCurrentUser();
      if (user && user.email) {
        // Extract name from email (remove @gmail.com or any domain)
        const name = user.email.split('@')[0];
        // Convert to title case (capitalize first letter of each word)
        const formattedName = name
          .split(/[._-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setUserName(formattedName);
      }
    };
    
    getUserInfo();
  }, []);

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
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white mr-3 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Annual Leave</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/reports" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                Reports
              </Link>
              {isAdmin && (
                <Link href="/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Users
                </Link>
              )}
              <Link href="/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                Settings
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* User name display */}
            {userName && (
              <div className="mr-4 text-sm font-medium text-gray-700">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {userName}
                </span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
          <div className="flex items-center sm:hidden">
            <button 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu */}
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {/* User name in mobile menu */}
          {userName && (
            <div className="px-3 py-2 text-base font-medium text-blue-700 border-l-4 border-blue-500 bg-blue-50">
              <span className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {userName}
              </span>
            </div>
          )}
          <Link href="/dashboard" className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Dashboard
          </Link>
          <Link href="/reports" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Reports
          </Link>
          {isAdmin && (
            <Link href="/users" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
              Users
            </Link>
          )}
          <Link href="/settings" className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
