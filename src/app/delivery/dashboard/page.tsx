'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeliveryDashboard from '@/components/DeliveryDashboard';
import { Truck } from 'lucide-react';

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      return;
    }

    const validateSession = async () => {
      // STRICT DELIVERY-ONLY AUTHENTICATION CHECK
      const token = localStorage.getItem('delivery-token');
      const user = localStorage.getItem('delivery-user');
      const userType = localStorage.getItem('delivery-userType');
      const sessionId = localStorage.getItem('delivery-sessionId');
      
      console.log('🔍 Delivery Dashboard Auth Check:', { 
        hasToken: !!token, 
        hasUser: !!user,
        userType,
        hasSessionId: !!sessionId,
        userValue: user 
      });
      
      // REQUIRE ALL AUTH DATA
      if (!token || !user || !sessionId) {
        console.log('❌ Missing token, user, or session, redirecting to delivery login');
        router.push('/delivery/login');
        setIsLoading(false);
        return;
      }

      // Validate session with database
      try {
        const sessionResponse = await fetch('/api/auth/delivery-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          console.log('❌ Invalid delivery session, redirecting to delivery login');
          localStorage.clear();
          router.push('/delivery/login');
          setIsLoading(false);
          return;
        }

        const sessionData = await sessionResponse.json();
        if (!sessionData.isValid || sessionData.user?.role !== 'delivery') {
          console.log('❌ Invalid delivery session, redirecting to delivery login');
          localStorage.clear();
          router.push('/delivery/login');
          setIsLoading(false);
          return;
        }

        console.log('✅ Delivery session validated successfully');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Error validating delivery session:', error);
        localStorage.clear();
        router.push('/delivery/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router]);

  return (
    <>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/50">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
              <div className="flex items-center space-x-2">
                <Truck className="h-6 w-6 text-yellow-500" />
                <p className="text-lg font-semibold text-white">Verifying delivery session...</p>
              </div>
            </div>
          </div>
        </div>
      ) : isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <DeliveryDashboard />
        </div>
      ) : null}
    </>
  );
}