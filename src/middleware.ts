import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the Supabase URL from environment variables or use a placeholder for cookie check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Extract project reference from URL to create the cookie name dynamically
  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
  // Check for authentication cookie using dynamic name
  const cookieName = `sb-${projectRef}-auth-token`;
  const hasAuthCookie = request.cookies.has(cookieName);
  
  // If no auth cookie and trying to access protected routes, redirect to login
  const isAuthRoute = request.nextUrl.pathname === '/';
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/employees') || 
    request.nextUrl.pathname.startsWith('/leave') || 
    request.nextUrl.pathname.startsWith('/settings') || 
    request.nextUrl.pathname.startsWith('/reports') || 
    request.nextUrl.pathname.startsWith('/users');

  if (!hasAuthCookie && isProtectedRoute) {
    // Create URL object safely
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // If has auth cookie and on auth route, redirect to dashboard
  if (hasAuthCookie && isAuthRoute) {
    // Create URL object safely
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/dashboard`);
  }

  return NextResponse.next();
}

// Add paths that should be checked by the middleware
export const config = {
  matcher: ['/', '/dashboard/:path*', '/employees/:path*', '/leave/:path*', '/settings/:path*', '/reports/:path*', '/users/:path*'],
};
