'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChefDashboard from '@/components/ChefDashboard';
import { ChefHat } from 'lucide-react';

export default function ChefDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      return;
    }

    const validateSession = async () => {
      // STRICT CHEF-ONLY AUTHENTICATION CHECK (using chef-specific keys)
      const token = localStorage.getItem('chef-token');
      const user = localStorage.getItem('chef-user');
      const userType = localStorage.getItem('chef-userType');
      const sessionId = localStorage.getItem('chef-sessionId');
      
      console.log('🔍 Chef Dashboard Auth Check:', { 
        hasToken: !!token, 
        hasUser: !!user,
        userType,
        hasSessionId: !!sessionId,
        userValue: user 
      });
      
      // REQUIRE ALL AUTH DATA
      if (!token || !user || !sessionId) {
        console.log('❌ Missing token, user, or session, redirecting to chef login');
        router.push('/chef/login');
        setIsLoading(false);
        return;
      }

      // Validate session with database
      try {
        const sessionResponse = await fetch('/api/auth/chef-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          console.log('❌ Session validation failed, redirecting to chef login');
          localStorage.clear(); // Clear invalid session data
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }

        const sessionData = await sessionResponse.json();
        if (!sessionData.isValid || sessionData.user?.role !== 'chef') {
          console.log('❌ Invalid chef session, redirecting to chef login');
          localStorage.clear();
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }

        console.log('✅ Chef session validated with database');
        
        // VERIFY USER TYPE MARKER
        if (userType !== 'chef') {
          console.log('❌ Invalid user type, not chef:', userType);
          localStorage.clear(); // Clear potentially corrupted data
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(user);
        console.log('👤 Parsed user data:', userData);
        
        // STRICT CHEF ROLE VERIFICATION
        if (userData.role !== 'chef') {
          console.log('❌ User role is not chef:', userData.role);
          localStorage.clear(); // Clear invalid data
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }
        
        // VERIFY CHEF PROFILE EXISTS
        if (!userData.chefProfile) {
          console.log('❌ No chef profile found for user');
          localStorage.clear();
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }
        
        // VERIFY USER TYPE CONSISTENCY
        if (userData.userType && userData.userType !== 'chef') {
          console.log('❌ UserType mismatch:', userData.userType);
          localStorage.clear();
          router.push('/chef/login');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Chef authentication successful - CHEF ONLY ACCESS GRANTED');
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('❌ Error validating session:', error);
        localStorage.clear();
        router.push('/chef/login');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-lg">Loading chef dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Authenticating your chef account</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg">Authentication failed</p>
          <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <ChefDashboard />;
}