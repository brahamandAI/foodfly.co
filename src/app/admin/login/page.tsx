"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store admin session data
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        
        toast.success('Admin login successful!');
        router.push('/admin');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Invalid credentials');
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white font-bold">🍕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FoodFly Admin</h1>
          <p className="text-gray-600 mt-2">Access your admin dashboard</p>
        </div>

        {/* PROMINENT CREDENTIALS SECTION */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl shadow-lg">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-green-800 mb-2">🔑 Admin Login Credentials</h2>
            <p className="text-sm text-green-700">Click to copy credentials and paste into the form below</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-inner">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Email:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@foodfly.com');
                    toast.success('Email copied to form!');
                  }}
                  className="font-mono text-lg text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  admin@foodfly.com
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Password:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword('password');
                    toast.success('Password copied to form!');
                  }}
                  className="font-mono text-lg text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  password
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@foodfly.com');
                  setPassword('password');
                  toast.success('Both credentials filled in the form!');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm"
              >
                📋 Fill Both Fields
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-green-700">
              💾 Stored in MongoDB database with bcrypt encryption
            </p>
          </div>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium text-center">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block mb-3 text-gray-900 font-bold text-lg">📧 Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-3 border-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all bg-white text-gray-900 font-semibold text-lg shadow-inner"
              placeholder="admin@foodfly.com"
              disabled={isLoading}
              required
              style={{ fontSize: '18px', color: '#1f2937' }}
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-3 text-gray-900 font-bold text-lg">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-3 border-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all bg-white text-gray-900 font-semibold text-lg shadow-inner"
              placeholder="password"
              disabled={isLoading}
              required
              style={{ fontSize: '18px', color: '#1f2937' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 rounded-lg font-bold text-white transition-all duration-200 shadow-lg ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In to Admin Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure authentication via database API
          </p>
        </div>
      </div>
    </div>
  );
} 