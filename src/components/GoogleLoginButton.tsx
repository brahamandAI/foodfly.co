'use client';

import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
  text?: string;
  className?: string;
}

export default function GoogleLoginButton({ 
  onSuccess, 
  onError, 
  text = "Continue with Google",
  className = ""
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      const errorMessage = 'No credential received from Google';
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
      return;
    }

    setIsLoading(true);
    try {
      // Send the actual Google ID token to your backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: credentialResponse.credential 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google authentication failed');
      }

      const data = await response.json();

      // Clear any existing guest state first
      localStorage.removeItem('guest');
      
      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');

      // Trigger auth state change events
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isLoggedIn: true, user: data.user }
      }));

      // Trigger storage event for header update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'isLoggedIn',
        newValue: 'true'
      }));

      // Migrate guest cart and load user cart from database
      try {
        const { unifiedCartService } = await import('@/lib/api');
        await unifiedCartService.migrateGuestCartOnLogin();
        await unifiedCartService.loadUserCartFromDatabase();
      } catch (error) {
        console.error('Error migrating guest cart:', error);
      }

      toast.success(data.message || 'Successfully signed in with Google!');
      onSuccess();

    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.message || 'Google authentication failed';
      toast.error(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMessage = 'Google authentication failed. Please try again.';
    toast.error(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        auto_select={false}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
        logo_alignment="left"
      />
      {isLoading && (
        <div className="flex items-center justify-center mt-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
          <span className="ml-2 text-sm text-gray-600">Signing in...</span>
        </div>
      )}
    </div>
  );
} 