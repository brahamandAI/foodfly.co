"use client";
import Link from 'next/link';

const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Customer', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', status: 'Active' },
  { id: '3', name: 'Bob Lee', email: 'bob@example.com', role: 'Customer', status: 'Inactive' },
];

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Manage Users</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-yellow-50">
                <td className="py-2 font-semibold">{user.name}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.role}</td>
                <td className="py-2">{user.status}</td>
                <td className="py-2 flex gap-2">
                  <button className="px-3 py-1 bg-yellow-400 text-[#232323] rounded hover:bg-yellow-500 font-semibold">Edit</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-semibold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 