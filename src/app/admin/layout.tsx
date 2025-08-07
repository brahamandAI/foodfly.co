'use client';
import AdminLayout from './AdminLayout';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip authentication check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');
      
      if (!token || !adminUser) {
        router.push('/admin/login');
        return;
      }

      try {
        const user = JSON.parse(adminUser);
        if (user.role !== 'admin') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing admin user:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    }
  }, [router, pathname]);

  // Handle login page rendering after hooks
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <AdminLayout>{children}</AdminLayout>;
} 