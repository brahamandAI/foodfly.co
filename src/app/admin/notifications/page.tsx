"use client";
import Link from 'next/link';

const notifications = [
  { id: '1', message: 'New order received', date: '2024-05-01', status: 'Unread' },
  { id: '2', message: 'Deal expiring soon', date: '2024-05-02', status: 'Read' },
  { id: '3', message: 'User signed up', date: '2024-05-03', status: 'Unread' },
];

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen bg-white text-[#232323] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary">Notifications</h1>
        <Link href="/admin" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
      <div className="bg-gray-100 rounded-xl shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Message</th>
              <th className="py-2">Date</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(notification => (
              <tr key={notification.id} className="border-b hover:bg-yellow-50">
                <td className="py-2 font-semibold">{notification.message}</td>
                <td className="py-2">{notification.date}</td>
                <td className="py-2">{notification.status}</td>
                <td className="py-2 flex gap-2">
                  <button className="px-3 py-1 bg-yellow-400 text-[#232323] rounded hover:bg-yellow-500 font-semibold">Mark as Read</button>
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