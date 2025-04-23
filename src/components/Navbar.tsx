'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoading = status === 'loading';

  // Handle admin/non-admin redirection
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user?.role === 'admin' && pathname === '/dashboard') {
        router.replace('/admin/dashboard');
      }
      if (pathname.startsWith('/admin') && 
         !['admin', 'super-admin'].includes(session.user?.role || '')) {
        router.replace('/dashboard');
      }
    }
  }, [status, session, pathname, router]);

  // Don't show navbar on auth pages
  if (pathname.startsWith('/auth')) return null;

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                g-form
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          {session && (
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                href={session.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                onClick={(e) => {
                  if (session.user?.role === 'admin' && pathname.startsWith('/dashboard')) {
                    e.preventDefault();
                    router.replace('/admin/dashboard');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname.includes('dashboard')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </span>
              </Link>
              
              {session.user?.role === 'admin' && (
                <>
                  <Link 
                    href="/admin/users"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/users')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Users
                    </span>
                  </Link>
                  <Link 
                    href="/admin/settings"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/settings')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Settings
                    </span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User/Auth Section */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="flex space-x-3">
                <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse"></div>
              </div>
            ) : session ? (
              <>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden md:flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg transition-all hover:bg-blue-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>Sign Out</span>
                </button>
                <div className="relative group">
                  <button className="flex items-center space-x-1 focus:outline-none">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="User avatar"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium shadow-sm">
                        {session.user?.name?.charAt(0).toUpperCase() || 
                         session.user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden lg:inline ml-2 text-sm font-medium text-gray-700">
                      {session.user?.name || session.user?.email}
                    </span>
                  </button>
                  {/* Dropdown menu would go here */}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg transition-all hover:bg-blue-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}