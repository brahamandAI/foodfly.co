'use client';

import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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