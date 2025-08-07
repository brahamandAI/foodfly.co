'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { usePathname } from 'next/navigation';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const pathname = usePathname();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Skip Google OAuth for chef and delivery routes to avoid conflicts
  const isChefRoute = pathname?.startsWith('/chef/');
  const isDeliveryRoute = pathname?.startsWith('/delivery/');
  const isAdminRoute = pathname?.startsWith('/admin/');
  
  if (isChefRoute || isDeliveryRoute || isAdminRoute) {
    console.log('🚫 Skipping Google OAuth for restricted route:', pathname);
    return <>{children}</>;
  }

  if (!clientId) {
    console.warn('Google Client ID not found. Google OAuth will not work.');
    return <>{children}</>;
  }

  return (
    <GoogleProvider 
      clientId={clientId}
      onScriptLoadError={() => console.error('Google OAuth script failed to load')}
      onScriptLoadSuccess={() => console.log('Google OAuth script loaded successfully')}
    >
      {children}
    </GoogleProvider>
  );
} 