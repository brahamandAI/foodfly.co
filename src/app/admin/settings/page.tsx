"use client";
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        <p className="text-lg text-gray-600">Settings page coming soon...</p>
      </div>
    </div>
  );
} 