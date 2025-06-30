"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { logout } from '@/lib/api';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/restaurants', label: 'Restaurants' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/settings', label: 'Settings' },
  // Add more links as needed
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Use centralized logout which handles both user and admin data
    logout();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#232323] text-white flex flex-col py-8 px-4 min-h-screen">
        <h2 className="text-2xl font-bold mb-10 text-primary">Admin Panel</h2>
        <nav className="flex-1 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-primary text-[#232323]' : 'hover:bg-gray-700 text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-10 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          Logout
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 bg-white min-h-screen">{children}</main>
    </div>
  );
} 