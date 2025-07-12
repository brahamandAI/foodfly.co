import React from "react";
import Image from "next/image";
import { UserPlus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const SignupPopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();

  const handleGuestLogin = () => {
    // Create a guest user object
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Guest User',
      email: 'guest@foodfly.com',
      isGuest: true
    };

    // Set guest session in localStorage
    localStorage.setItem('guest', 'true');
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('isLoggedIn', 'true');

    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { isLoggedIn: true, user: guestUser }
    }));

    // Show success message
    toast.success('Welcome! You are now logged in as a guest.');

    // Close popup and redirect to home page
    onClose();
    router.push('/');
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google login
    toast.loading('Connecting to Google...');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
      <div className="relative bg-white/60 dark:bg-gray-900/60 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 w-full max-w-md flex flex-col items-center animate-fade-in backdrop-blur-2xl">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none transition-colors duration-200"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {/* Logo */}
        <div className="mb-4">
          <Image src="/images/logo.png" alt="FoodFly Logo" width={60} height={60} className="rounded-full shadow-md border-2 border-yellow-400 bg-white" />
        </div>
        {/* Heading */}
        <h2 className="text-3xl font-extrabold mb-2 text-center text-gray-900 dark:text-white drop-shadow">Welcome to FoodFly!</h2>
        <p className="text-gray-700 dark:text-gray-200 text-center mb-6">Sign up to unlock exclusive deals, track orders, and get personalized recommendations. Or continue as a guest!</p>
        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full mt-2">
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-2.5 rounded-lg font-semibold text-lg shadow hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200">
            <UserPlus className="w-5 h-5" /> Sign Up
          </button>
          
          {/* Google Login Button */}
          <button 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 bg-white/90 text-gray-800 py-2.5 rounded-lg font-semibold text-lg shadow hover:bg-white transition-all duration-200 border border-gray-300/50"
          >
            <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
            Continue with Google
          </button>

          <button 
            onClick={handleGuestLogin}
            className="flex items-center justify-center gap-2 bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-800 dark:text-white py-2.5 rounded-lg font-semibold text-lg shadow hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200"
          >
            <User className="w-5 h-5" /> Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup; 